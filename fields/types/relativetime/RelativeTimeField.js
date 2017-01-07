import Field from '../Field';
import React from 'react';
import { FormRow, FormField, FormInput, FormLabel, FormSelect } from 'elemental';
import moment from 'moment';
import _ from 'lodash';
import {convertValueToValues, elems} from './relativeTimeUtil';

module.exports = Field.create({

	displayName: 'RelativeTimeField',

	focusTargetRef: 'hour',

	getInitialState: function() {

		var value = this.props.value;
		var values = convertValueToValues(value);

		return {
			value: value,
			values: values
		};
	},

	convertValuesToValue: function(values){
		var factor = values.sign == '-' ? -1 : 1;
		var seconds = 0;
		seconds += values.years * 366 * 24 * 60 * 60;
		seconds += values.months * 24 * 60 * 60;
		seconds += values.days * 60 * 60;
		seconds += values.hours * 60 * 60;
		seconds += values.minutes * 60;
		seconds += values.seconds;
		return seconds * factor;
	},

	valueChanged (which, event) {
		this.state.values[which] = event.target.value;
		this.state.value = this.convertValuesToValue(this.state.values);
		this.setState({
			value: this.state.value,
			values: this.state.values
		});
		this.props.onChange({
			path: this.props.path,
			value: this.state.value,
		});
	},

	getDisplay() {
		var buffer = this.props.label + ' ';
		_.each(elems, function(u){
			if(this.state.values[u] > 0){
				buffer += this.state.values[u] + ' ' + u + ' '
			}
		}, this);
	},

	renderValue () {
		if (_.isNumber(this.props.value)) {
			return <FormInput noedit>{this.getDisplay()}</FormInput>;
		}
		return <FormInput noedit>(not set)</FormInput>;
	},

	renderField () {
		return (
			<div>
			<FormRow>
				{
					(()=> {
						var options = [{label: 'After', value: '+'}, {label: 'Before', value: '-'}];
						if (this.props.signEditable) {
							return <FormSelect options={options}
											   firstOption={'+'}
											   value={this.state.values.sign}
												onChange={this.valueChanged.bind(this, 'sign')}>
							</FormSelect>
						}else{
							var label = _.find(options, {value: this.state.values.sign}).label;
							return <FormLabel>{label}</FormLabel>
						}
					})()
				}
			</FormRow>
			<FormRow>
				{
					_.map(elems, (u)=>{
						return <FormField width="one-third">
							<FormLabel>{u}</FormLabel>
							<FormInput type="number" name={this.props.path + '.' + u} placeholder={u} ref={u} value={this.state.values[u]} onChange={this.valueChanged.bind(this, u)} autoComplete="off" />
						</FormField>;
					}, this)
				}
			</FormRow>
			</div>
		);
	},

});
