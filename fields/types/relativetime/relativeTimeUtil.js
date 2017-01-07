/**
 * Created by liulun on 16/10/10.
 */
import moment from 'moment';
import _ from 'lodash';

var elems = ['years', 'months', 'days', 'hours', 'minutes', 'seconds'];

function convertValueToValues(value){
	var values = {};
	values.sign = value < 0 ? '-' : '+';

	var duration = moment.duration(Math.abs(value), 'seconds');
	_.each(elems, function(u){
		values[u] = duration[u]();
	});
	return values;
}

function getDisplay(value){
	var values = convertValueToValues(value);
	var nonZeroElems = _.filter(elems, (e)=>values[e] > 0);
	var units = _.map(nonZeroElems, (e)=>`${values[e]} ${e}`);
	if(units.length == 0){
		return '0';
	}else{
		return units.join(',');
	}
}

module.exports = {
	convertValueToValues,
	getDisplay,
	elems
};
