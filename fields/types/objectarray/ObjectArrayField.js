var _ = require('lodash'),
	React = require('react'),
	Field = require('../Field'),
	lastId = 0;

var WidthProvider = require('react-grid-layout').WidthProvider;
var ReactGridLayout = require('react-grid-layout');
ReactGridLayout = WidthProvider(ReactGridLayout);

module.exports = Field.create({

	displayName: 'ObjectArrayField',

	getInitialState: function() {
		var values;

		if (this.props.value && this.props.value instanceof Array && this.props.value.length) {
			values = this.props.value.map(function(item) {
				return this.newItem(item, this.props.parts);
			}.bind(this));
		} else {
			values = [];
		}

		return {
			values: values
		};
	},

	newItem(defaultItemValue, parts) {
		lastId++;
		var item = {
			key: 'i' + lastId,
			obj: {},
			valueKeys: []
		};

		for (var i in parts) {
			if (parts.hasOwnProperty(i)) {
				item.obj[i] = {
					key: item.key + '_' + i,
					fieldName: i,
					label: parts[i].label,
					type: parts[i].type,
					value: defaultItemValue[i] ? defaultItemValue[i] : null
				};
				if(this.props.layoutMode == '2d'){
					item.obj.frame = defaultItemValue.frame || {x: 0, y: 0, w: 4, h: 3}
				}
				item.valueKeys.push(i);
			}
		}

		return item;
	},

	addItem: function() {
		var newValues = this.state.values.concat(this.newItem({}, this.props.parts));

		this.setState({
			values: newValues
		});

		this.valueChanged(newValues);
	},

	removeItem: function(i) {
		this.state.values.splice(i, 1);

		this.setState({
			values: this.state.values
		});

		this.valueChanged(this.state.values);
	},

	updateItem: function(obj, objIndex, parentIndex, event) {
		var updatedValues = this.state.values;

		// if we define cleanInput method then clean it first
		updatedValues[parentIndex].obj[objIndex].value = this.cleanInput ? this.cleanInput(event.value) : event.value;

		this.setState({
			values: updatedValues
		});

		this.valueChanged(updatedValues);
	},

	valueChanged: function(values) {
		var objectArray = [];

		var me = this;

		values.forEach(function(item) {
			var obj = {};

			_.forEach(item.obj, function(val, propertyKey) {
				if (typeof val !== 'function') {
					obj[propertyKey] = item.obj[propertyKey].value;
				}
				if(me.props.layoutMode == '2d'){
					obj.frame = item.obj.frame;
				}
			});

			objectArray.push(obj);
		});

		this.props.onChange({
			path: this.props.path,
			value: objectArray
		});
	},

	renderPart: function(obj/*value*/, objIndex/*propertyIndex*/, parentIndex/*arrayIndex*/) {
		var fieldName = this.props.path + '[' + parentIndex + ']' +'[' + obj.fieldName + ']';
		var input = <input ref={obj.key} className='form-control multi' type={obj.type} name={fieldName} value={obj.value} autoComplete='off' onChange={this.updateItem.bind(this, obj, objIndex, parentIndex)} />;

		var self = this;

		var getFieldProps = function(field) {
			var props = Object.assign({}, field);
			props.value = obj.value;
			props.onChange = self.updateItem.bind(self, obj, objIndex, parentIndex);
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
				<legend>
					<strong>{this.props.itemLabel} {itemIndex + 1}</strong>
					<a href="javascript:;" className="field-item-button btn-cancel" onClick={this.removeItem.bind(this, itemIndex)}>x</a>
				</legend>
				{item.valueKeys.map(function(propertyIndex) {
					return self.renderPart(item.obj[propertyIndex], propertyIndex, itemIndex);
				})}
			</fieldset>
		);
	},

	onLayoutChange(layout){
		console.log(layout);
		for(var i = 0;i < layout.length; i++){
			this.state.values[i].obj.frame = _.pick(layout[i], ['x', 'y', 'w', 'h']);
		}
		this.valueChanged(this.state.values);
	},

	renderField: function () {
		return (
			<div>
				{
					(()=>{
						if(! this.props.layoutMode){
							return this.state.values.map(this.renderItem)
						}else if(this.props.layoutMode == '2d'){
							return <ReactGridLayout
							className="layout"
						    cols={12}
							onLayoutChange={this.onLayoutChange}
							rowHeight={20} width={1200}>
								{
									this.state.values.map((item, itemIndex)=>{
										return <div key={'i' + itemIndex} data-grid={item.obj.frame}>
											{this.renderItem(item, itemIndex)}
										</div>;
									})
								}
							</ReactGridLayout>
						}
					})()
				}
				<button type="button" className='btn btn-xs btn-default' onClick={this.addItem}>Add item</button>
			</div>
		);
	},

	// Override shouldCollapse to check for array length
	shouldCollapse: function () {
		return this.props.collapse && !this.props.value.length;
	}
});
