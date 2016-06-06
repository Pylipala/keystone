var _ = require('underscore'),
	React = require('react'),
	Field = require('../Field');

function newItem(itemValue, parts) {
	var item = {
		obj: {},
		valueKeys: []
	};

	for(var i in parts) {
		if (parts.hasOwnProperty(i)) {
			item.obj[i] = {
				key: item.key + '_' + i,
				fieldName: i,
				label: parts[i].label,
				type: parts[i].type,
				value: itemValue[i] ? itemValue[i] : ''
			};

			item.valueKeys.push(i);
		}
	}

	return item;
}

module.exports = Field.create({

	displayName: 'NestedObjectField',

	getInitialState: function() {

		var value = newItem(this.props.value || {}, this.props.parts);

		return {
			values: value
		};
	},

	updateItem: function(obj, objIndex, event) {
		var updatedValues = this.state.values;

		// if we define cleanInput method then clean it first
		updatedValues.obj[objIndex].value = this.cleanInput ? this.cleanInput(event.value) : event.value;

		this.setState({
			values: updatedValues
		});

		this.valueChanged(updatedValues);
	},

	valueChanged: function(values) {
		var obj = {};

		_.forEach(values.obj, function(val, propertyKey) {
			if (typeof val !== 'function') {
				obj[propertyKey] = values.obj[propertyKey].value;
			}
		});

		this.props.onChange({
			path: this.props.path,
			value: obj
		});
	},

	renderPart: function(obj/*value*/, objIndex/*propertyIndex*/) {
		var fieldName = this.props.path +'[' + obj.fieldName + ']';
		var input = <input ref={obj.key}
						   className='form-control multi'
						   type={obj.type}
						   name={fieldName}
						   value={obj.value}
						   autoComplete='off'
						   onChange={this.updateItem.bind(this, obj, objIndex)} />;

		var self = this;

		var getFieldProps = function(field) {
			var props = Object.assign({}, field);
			props.value = obj.value;
			props.onChange = self.updateItem.bind(self, obj, objIndex);
			props.mode = 'edit';
			props.path = fieldName;
			return props;
		};

		var part = this.props.partsOptions[objIndex];
		var props = getFieldProps(part);
		var Fields = require('../../../admin/client/fields');

		switch (part.type) {
			case 'select':
			case 'relationship':
			case 'number':
			case 'text':
			case 'email':
			case 'date':
			case 'datetime':
			case 'hidden':
			case 'url':
			case 'password':
			case 'color':
			case 'month':
			case 'week':
			case 'textarea':
			case 'nestedobject':
			default:
				input = React.createElement(Fields[part.type], props);
		}

		return (
			<div key={obj.key}>
				{input}
			</div>
		);
	},

	renderItem: function(item, itemIndex) {
		var self = this;

		return (
			<fieldset key={item.key} className='field-item'>
				{item.valueKeys.map(function(propertyIndex) {
					return self.renderPart(item.obj[propertyIndex], propertyIndex, itemIndex);
				})}
			</fieldset>
		);
	},

	renderField: function () {
		return (
			<div>
				{this.renderItem(this.state.values)}
			</div>
		);
	}
});
