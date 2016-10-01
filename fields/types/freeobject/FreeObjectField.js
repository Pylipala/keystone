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
			value: unescapedValue ? JSON.stringify(unescapedValue, null, 4) : '',
			hasError: false
		};
	},

	valueChanged: function(e) {
		var value = e.target.value;
		try{
			JSON.parse(value);
		}catch(e){
			this.setState({
				value: value,
				hasError: true
			});
			return;
		}

		this.setState({
			value: value,
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
