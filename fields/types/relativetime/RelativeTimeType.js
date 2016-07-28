var _ = require('lodash');
var FieldType = require('../Type');
var util = require('util');
var utils = require('keystone-utils');
var moment = require('moment');

/**
 * RelativeTime FieldType Constructor
 * @extends Field
 * @api public
 */
function relativetime (list, path, options) {
	this._fixedSize = 'medium';
	this._properties = ['sign', 'signEditable', 'label'];
	this.sign = options.sign || '+';
	this.signEditable = !! options.signEditable;
	this.label = options.label || 'after';
	// TODO: implement filtering
	options.nofilter = true;
	relativetime.super_.call(this, list, path, options);
}
util.inherits(relativetime, FieldType);

/**
 * Registers the field on the List's Mongoose Schema.
 */
relativetime.prototype.addToSchema = function (parentSchema) {
	var schema = parentSchema || this.list.schema;
	schema.path(this.path, _.defaults({ type: Number }, this.options));
	this.bindUnderscoreMethods();
};

/**
 * Gets the field's data from an Item, as used by the React components
 */
relativetime.prototype.getData = function (item) {
	var v = item.get(this.path);
	return v;
};

/**
 * Formats the field value
 */
relativetime.prototype.format = function (item) {
	var value = item.get(this.path);
    if (_.isNumber(value)) {
		var prefix = value > 0 ? 'Plus ' : (value == 0 ? '' : 'Minus ');
		return prefix + moment.duration(value, 'seconds').humanize();
	}
	return null;
};

/**
 * Asynchronously confirms that the provided value is valid
 */
relativetime.prototype.validateInput = function (data, callback) {
	var value = this.getValueFromData(data);
	var result = false;
	if (value === undefined || value === null || value === '') {
		result = true;
	} else {
		if (_.isNumber(value)) {
			result = true;
		}
		if (typeof value === 'string') {
			result = ! _.isNaN(Number(value));
		}
	}
	utils.defer(callback, result);
};

/**
 * Asynchronously confirms that the a value is present
 */
relativetime.prototype.validateRequiredInput = function (item, data, callback) {
	var value = this.getValueFromData(data);
	var result = (value || (value === undefined && item.get(this.path))) ? true : false;
	utils.defer(callback, result);
};

/**
 * Validates that a value for this field has been provided in a data object
 *
 * Deprecated
 */
relativetime.prototype.inputIsValid = function (data, required, item) { // eslint-disable-line no-unused-vars
	var values = this.getValueFromData(data);
	// Input is valid if the field is not required, and not present
	if (values === undefined && !required) return true;
	if(_.isNumber(values)) return true;
	if(! _.isNaN(Number(values))) return true;
	return false;
};

/**
 * Updates the value for this field in the item from a data object
 */
relativetime.prototype.updateItem = function (item, data, callback) {
	var value = this.getValueFromData(data);
	if (value === undefined) return process.nextTick(callback);
	if (typeof value === 'number') {
		item.set(this.path, value);
	} else if (!_.isNaN(Number(value))) {
		item.set(this.path, Number(value));
	}
	process.nextTick(callback);
};

/* Export Field Type */
module.exports = relativetime;
