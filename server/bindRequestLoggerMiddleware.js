/**
 * Created by liulun on 16/6/16.
 */
var _ = require('lodash');
var util = require('util');
const domain = require('domain');
const process = require('process');
const cu = require('@pylipala.com/chunxiao-util');

module.exports = function bindStaticMiddleware (keystone, app) {
	var option = keystone.get('requestLogger');

	if(! option){
		return;
	}

	var requestLoggerOption = _.defaults({}, option, {
		requestModelName: 'RequestRecord',
		logModelName: 'LogRecord',
		replaceConsoleLog: true,
		keepConsoleLog: true,
		logLevel: 'info',
		perRequestLogLevelToken: 'perRequestLogLevelToken'
	});

	function escapeSensitiveData(method, url, body){
		if(method != 'POST'){
			return body;
		}
		var clone = _.cloneDeep(body);

		if(requestLoggerOption.bodyLogFilter){
			try{
				clone = requestLoggerOption.bodyLogFilter(method, url, clone);
			}catch(e){
				console.error('escapeSensitiveData meet error:');
				console.error(e);
			}
		}

		if(url == '/' + keystone.get('admin path') + '/api/session/signin'){
			if(clone.password){
				clone.password = '*****';
			}
		}else if(new RegExp('/' + keystone.get('admin path') + '/users/.*').exec(url)){
			if(clone.password){
				clone.password = '*****';
				clone.password_confirm = '*****';
			}
		}
		clone = cu.mongoPatch.escapeDotDollar(clone);
		return clone;
	}

	keystone.set('requestLoggerOption', requestLoggerOption);

	function defineLogModels(){
            var RequestRecord = new keystone.List(requestLoggerOption.requestModelName, {
                history: false,
                track: false,
                nocreate: true,
                //noedit: true
            });

            var Types = keystone.Field.Types;
            var mongoose = keystone.mongoose;

            RequestRecord.add(
                'Remote',
                {
                    requestTime: { type: Types.Datetime, index: true },
                    remoteAddress: { type: Types.Text },
					user: { type: Types.Relationship, ref: keystone.get('user model')},
                },
                'Payload',
                {
					requestMethod: { type: Types.Select, options: 'GET, POST' },
                    requestUrl: { type: Types.Text },
                    requestBody: { type: Types.FreeObject }
                },
                'Response',
                {
                    responseStatus: { type: Types.Number },
                    responseTime: { type: Types.Datetime },
                    processTime: { type: Types.Number }, // time used to handle the request, in milliseconds
                },
				'LogLevel',
				{
					logLevel: { type: Types.Select, options: 'trace, debug, info, warn, error, fatal'},
				}
            );

            RequestRecord.defaultColumns = 'requestTime, requestMethod, requestUrl, remoteAddress, responseStatus, processTime';
            RequestRecord.defaultSort = '-requestTime';
            RequestRecord.register();

            var LogRecord = new keystone.List(requestLoggerOption.logModelName, {
                history: false,
                track: false,
                nocreate: true,
                //noedit: true
            });

            LogRecord.add(
                'Remote',
                {
                    logTime: { type: Types.Datetime, index: true },
                    requestRecord: { type: Types.Relationship, ref: requestLoggerOption.requestModelName},
                    logLevel: { type: Types.Select, options: 'trace, debug, info, warn, error, fatal'},
                    key: { type: Types.Text },
                    message: { type: Types.Textarea },
                    detail: { type: Types.FreeObject },
                }
            );

            LogRecord.defaultColumns = 'logTime, key, message, logLevel';
            LogRecord.defaultSort = '-logTime';
            LogRecord.register();

			RequestRecord.relationship({ ref: 'LogRecord', path: 'logRecords', refPath: 'requestRecord' });

			return {RequestRecord:RequestRecord, LogRecord:LogRecord};
        }

	var logModels = defineLogModels();

    var RequestRecord = logModels.RequestRecord;
	var LogRecord = logModels.LogRecord;

	keystone.logger = {};
	var levels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];
	var levelMap = {};
	for(var i = 0;i < levels.length; i++){
		levelMap[levels[i]] = i;
	}

	var saveCallback = function(error){
		if(error){
			if(! requestLoggerOption.replaceConsoleLog){
				console.error(error);
			}else{
				console.error('Save log meet error!!!');
				console.old_error(error);
			}
		}
	};

	_.each(levels, function(level){
		keystone.logger[level] = function(message, key, detail){
			var args = arguments;
			if(args.length == 0){
				return;
			}
			if(args.length == 1 && !args[0]){
				return;
			}
			var d = process.domain;
			var requestRecord = d ? d.requestRecord : null;
			var requestLogLevel = requestRecord ? requestRecord.logLevel : 'info';
			if(levelMap[level] < levelMap[requestLogLevel]){
				return;
			}
			var logRecord = new LogRecord.model({
				logTime: new Date(),
				requestRecord: requestRecord ? requestRecord._id : null,
				logLevel: level,
				key: key,
				message: message,
				detail: detail,
			});

            logRecord.save(saveCallback);
		};
		if(requestLoggerOption.replaceConsoleLog){
			var oldMethod = console[level];
			console[level] = keystone.logger[level];
			console['old_' + level] = oldMethod;
		}
	});
	if(requestLoggerOption.replaceConsoleLog){
		var oldMethod = console['log'];
		console['log'] = function(){
			var message = util.format.apply(util.format, Array.prototype.slice.call(arguments));
			keystone.logger['info'](message);
			if(requestLoggerOption.keepConsoleLog){
				oldMethod.apply(console, Array.prototype.slice.call(arguments));
			}
		};
		console['old_log'] = oldMethod;
	}

	app.use(function (req, res, next) {
		var logLevelInReq = req.params['logLevel'];
		var logLevel = requestLoggerOption.logLevel;
		if(logLevelInReq
				&& _.indexOf(levels, logLevelInReq) >= 0
				&& req.params['perRequestLogLevelToken'] == requestLoggerOption.perRequestLogLevelToken){
			logLevel = logLevelInReq;
		}
		var d = domain.create();
		d.add(req);
		d.add(res);
		var requestRecord = new logModels.RequestRecord.model({
			requestTime: new Date(),
			remoteAddress: req.ip,
			user: req.user ? req.user._id : undefined,
			requestMethod: req.method,
			requestUrl: req.url,
			requestBody: escapeSensitiveData(req.method, req.url, req.body),
			responseStatus: null,
			responseTime: null,
			processTime: null,
			logLevel: logLevel,
		});

		var onReqEnd = d.bind(function(){
			var endTime = new Date();
			logModels.RequestRecord.updateItem(requestRecord, {
				user: req.user ? req.user._id : undefined,
				responseStatus: res.statusCode,
				responseTime: endTime,
				processTime: endTime - requestRecord.requestTime,
			}, saveCallback);
		});

		res.on('close', onReqEnd);
		res.on('finish', onReqEnd);

		d.run(function(){
			d.requestRecord = requestRecord;
			requestRecord.save(saveCallback);
			next();
		});
	});
};
