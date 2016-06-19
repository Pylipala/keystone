var _ = require('underscore'),
	React = require('react'),
	Field = require('../Field');


module.exports = Field.create({

	displayName: 'FreeObjectField',

	getInitialState: function() {

		var value = this.props.value;

		return {
			value: JSON.stringify(value, null, 4),
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

		this.props.onChange({
			path: this.props.path,
			value: value
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
