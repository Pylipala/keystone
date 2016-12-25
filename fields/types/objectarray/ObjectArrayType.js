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

function objectarray(list, path, options) {
	this._nativeType = [Schema.Types.Mixed];
	this._properties = ['parts', 'itemLabel'];

	this.itemLabel = options.itemLabel || 'Item';
	this.parts = options.parts;
	this.layoutMode = options.layoutMode;

	objectarray.super_.call(this, list, path, options);
}

objectarray.properName = 'ObjectArray';

/*!
 * Inherit from Field
 */

util.inherits(objectarray, super_);

/**
 * Get client-side properties to pass to react field.
 */
objectarray.prototype.getProperties = function () {
	this.partsOptions = this.partsOptions || _.mapObject(this.parts, function(fieldOption, fieldName){
			fieldOption.isNestedField = true;
		return new fieldOption.type(this.list, fieldName, fieldOption).getOptions();
	}, this);

	return {
		partsOptions: this.partsOptions,
		layoutMode: this.layoutMode
	};
};

objectarray.prototype.addToSchema = function (parentSchemaParam) {
	var ops = (this._nativeType) ? _.defaults({ type: this._nativeType }, this.options) : this.options;
	var parentSchema = parentSchemaParam || this.list.schema;
	var objInit = {};
	if(this.layoutMode == '1d'){
		objInit = {sequenceNo: Number}
	}else if(this.layoutMode == '2d'){
		objInit = {frame: {x: Number, y: Number, w: Number, h: Number}};
	}
	var objSchema = new Schema(objInit);
	_.each(this.parts, (function(fieldOption, fieldName){
		fieldOption.isNestedField = true;
		var childField = new fieldOption.type(this.list, fieldName, fieldOption);
		childField.addToSchema(objSchema);
	}).bind(this));
	parentSchema.path(this.path, [objSchema]);
	this.bindUnderscoreMethods();
};

/**
 * Validates that a value for this field has been provided in a data object
 *
 * @api public
 */

objectarray.prototype.validateInput = function(data, callback, item) {
	var value = this.getValueFromData(data);

	// TODO validate child node

	return utils.defer(callback, true);
};

/**
 * Updates the value for this field in the item from a data object
 *
 * @api public
 */

objectarray.prototype.updateItem = function(item, data, callback) {
	var value = this.getValueFromData(data);

	if (typeof value === 'undefined') {
		return callback();
	}

	if (Array.isArray(value)) {
		item.set(this.path, value);
		async.times(value.length, (function(index, callback){
			async.each(_.keys(this.parts), (function(fieldName, callback){
				var fieldOption = this.parts[fieldName];
				fieldOption.isNestedField = true;
				var childField = new fieldOption.type(this.list, fieldName, fieldOption);
				childField.updateItem(item[this.path][index], value[index], callback);
			}).bind(this), function(){
				callback();
			})
		}).bind(this), callback);
	} else {
		item.set(this.path, []);
		callback();
	}
};

/*!
 * Export class
 */

exports = module.exports = objectarray;
