var _ = require('underscore'),
	React = require('react'),
	Field = require('../Field');
var util = require('@pylipala.com/chunxiao-util');

module.exports = Field.create({

	displayName: 'FreeObjectField',

	getInitialState: function() {

		var value = this.props.value;

		var unescapedValue = util.mongoPatch.unescapeDotDollar(value);

		return {
			value: JSON.stringify(unescapedValue, null, 4),
			hasError: false
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

	valueChanged: function(value) {
		try{
			JSON.parse(value);
		}catch(e){
			this.setState({
				hasError: true
			});
			return;
		}

		this.setState({
			hasError: false
		});

		var escapedValue = util.mongoPatch.escapeDotDollar(value);

		this.props.onChange({
			path: this.props.path,
			value: escapedValue
		});
	},


	renderField () {
		var styles = {
			height: this.props.height,
		};
		if(this.state.hasError){
			styles.borderColor = 'red';
		}
		return <textarea name={this.props.path}
						 styles={styles}
						 ref="focusTarget"
						 value={this.state.value}
						 onChange={this.valueChanged}
						 autoComplete="off"
						 className="FormInput" />;
	},
});
