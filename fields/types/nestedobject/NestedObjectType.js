/*!
 * Module dependencies.
 */

var util = require('util'),
	utils = require('keystone-utils'),
	Schema = require('mongoose').Schema,
	super_ = require('../Type'),
	_ = require('underscore');

/**
 * ObjectArray FieldType Constructor
 * @extends Field
 * @api public
 */

function nestedobject(list, path, options) {
	this._nativeType = Schema.Types.Mixed;
	this._properties = ['parts', 'itemLabel'];

	this.itemLabel = options.itemLabel || 'Item';
	this.parts = options.parts;


	nestedobject.super_.call(this, list, path, options);
}

/*!
 * Inherit from Field
 */

util.inherits(nestedobject, super_);

/**
 * Get client-side properties to pass to react field.
 */
nestedobject.prototype.getProperties = function () {
	this.partsOptions = this.partsOptions || _.mapObject(this.parts, function(fieldOption, fieldName){
		return new fieldOption.type(this.list, fieldName, fieldOption).getOptions();
	}, this);

	return {
		partsOptions: this.partsOptions
	};
};

/**
 * Validates that a value for this field has been provided in a data object
 *
 * @api public
 */

nestedobject.prototype.validateInput = function(data, required, item) {
	var value = this.getValueFromData(data);

	if (required) {
		if (value === undefined && item && item.get(this.path)) {
			return true;
		}

		if (value === undefined || !_.isObject(value)) {
			return false;
		}

		if (Array.isArray(value) && !value.length) {
			return false;
		}

		return true;
	}

	return (value === undefined || _.isObject(value));
};

/**
 * Updates the value for this field in the item from a data object
 *
 * @api public
 */

nestedobject.prototype.updateItem = function(item, data, callback) {
	var value = this.getValueFromData(data);

	if (typeof value === 'undefined' || value === null || !value) {
		value = {};
	}

	if (_.isObject(value)) {
		value = _.pick(value, _.keys(this.parts));
		item.set(this.path, value);
	} else {
		item.set(this.path, {});
	}

	callback();
};

/*!
 * Export class
 */

exports = module.exports = nestedobject;
