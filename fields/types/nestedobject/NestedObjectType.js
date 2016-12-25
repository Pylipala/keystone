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

function nestedobject(list, path, options) {
	this._nativeType = Schema.Types.Mixed;
	this._properties = ['parts', 'itemLabel'];

	this.itemLabel = options.itemLabel || 'Item';
	this.parts = options.parts;


	nestedobject.super_.call(this, list, path, options);
}

nestedobject.properName = 'NestedObject';

/*!
 * Inherit from Field
 */

util.inherits(nestedobject, super_);

/**
 * Get client-side properties to pass to react field.
 */
nestedobject.prototype.getProperties = function () {
	this.partsOptions = this.partsOptions || _.mapObject(this.parts, function(fieldOption, fieldName){
			fieldOption.isNestedField = true;
		return new fieldOption.type(this.list, fieldName, fieldOption).getOptions();
	}, this);

	return {
		partsOptions: this.partsOptions
	};
};

nestedobject.prototype.addToSchema = function (parentSchemaParam) {
	var ops = (this._nativeType) ? _.defaults({ type: this._nativeType }, this.options) : this.options;
	var parentSchema = parentSchemaParam || this.list.schema;
	var objSchema = new Schema({});
	_.each(this.parts, (function(fieldOption, fieldName){
		fieldOption.isNestedField = true;
		var childField = new fieldOption.type(this.list, fieldName, fieldOption);
		childField.addToSchema(objSchema);
	}).bind(this));
	parentSchema.path(this.path, objSchema);
	this.bindUnderscoreMethods();
};

/**
 * Validates that a value for this field has been provided in a data object
 *
 * @api public
 */

nestedobject.prototype.validateInput = function(data, callback) {
	var value = this.getValueFromData(data);

	// TODO validate child node

	return utils.defer(callback, true);
};

/**
 * Updates the value for this field in the item from a data object
 *
 * @api public
 */

nestedobject.prototype.updateItem = function(item, data, callback) {
	var value = this.getValueFromData(data);

	if (typeof value === 'undefined') {
		return callback();
	}

	if (_.isObject(value)) {
		item.set(this.path, value);
		async.each(_.keys(this.parts), (function(fieldName, callback){
			var fieldOption = this.parts[fieldName];
			fieldOption.isNestedField = true;
			var childField = new fieldOption.type(this.list, fieldName, fieldOption);
			childField.updateItem(item[this.path], value, callback);
		}).bind(this), function(){
			callback();
		})
	} else {
		item.set(this.path, {});
		callback();
	}
};

/*!
 * Export class
 */

exports = module.exports = nestedobject;
