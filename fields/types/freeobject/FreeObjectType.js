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

freeobject.prototype.validateInput = function(data, required, item) {
	var value = this.getValueFromData(data);

	if (required) {
		if (value === undefined && item && item.get(this.path)) {
			return true;
		}

		if(! parseJson(value).success){
			return false;
		}

		return true;
	}

	return (value === undefined || _.isString(value));
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

	item.set(this.path, parseJson(value).value);
};

/*!
 * Export class
 */

exports = module.exports = freeobject;
