var multer = require('multer');
var bodyParser = require('body-parser');
var bodyPatch = require('@pylipala.com/chunxiao-util').bodyPatch;

module.exports = function bindIPRestrictions (keystone, app) {
	// Set up body options and cookie parser
	var bodyParserParams = {};
	if (keystone.get('file limit')) {
		bodyParserParams.limit = keystone.get('file limit');
	}
	app.use(bodyParser.json(bodyParserParams));
	bodyParserParams.extended = true;
	app.use(bodyParser.urlencoded(bodyParserParams));
	app.use(multer({
		includeEmptyFields: true,
	}));
	app.use(function (req, res, next) {
		if(req.files){
			if(req.body.form && typeof req.body.form == 'string'){
				try{
					req.body = JSON.parse(req.body.form);
				}catch(e){
					// we will all use json as format
				}
			}
		}
		if(req.body){
			bodyPatch(req.body);
		}
		next();
	});
};
