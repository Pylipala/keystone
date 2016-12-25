/*!
 * Module dependencies.
 */

var util = require('util'),
	utils = require('keystone-utils'),
	Schema = require('mongoose').Schema,
	super_ = require('../Type'),
	_ = require('underscore'),
	async = require('async');

/**
 * ObjectArray FieldType Constructor
 * @extends Field
 * @api public
 */

function freeobject(list, path, options) {
	this._nativeType = Schema.Types.Mixed;

	freeobject.super_.call(this, list, path, options);
}

freeobject.properName = 'FreeObject';

/*!
 * Inherit from Field
 */

util.inherits(freeobject, super_);

var parseJson = function(v){
	var result;
	try{
		result = JSON.parse(v);
	}catch(e){
		return {
			success: false,
			error: e
		}
	}
	return {
		success: true,
		value: result
	}
}

freeobject.prototype.validateInput = function(data, callback) {
	var value = this.getValueFromData(data);

	var valid = true;

	if (_.isString(value)){
		valid = parseJson(value).success;
	}

	utils.defer(callback, valid);
};

/**
 * Updates the value for this field in the item from a data object
 *
 * @api public
 */

freeobject.prototype.updateItem = function(item, data, callback) {
	var value = this.getValueFromData(data);

	if (typeof value === 'undefined') {
		return callback();
	}

	item.set(this.path, _.isString(value) ? parseJson(value).value : value);

	callback();
};

/*!
 * Export class
 */

exports = module.exports = freeobject;
