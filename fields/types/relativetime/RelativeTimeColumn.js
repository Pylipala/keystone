import React from 'react';
import ItemsTableCell from '../../../admin/client/components/ItemsTable/ItemsTableCell';
import ItemsTableValue from '../../../admin/client/components/ItemsTable/ItemsTableValue';
import {getDisplay} from './relativeTimeUtil';

var RelativeColumnColumn = React.createClass({
	displayName: 'RelativeColumnColumn',
	renderValue () {
		const value = this.props.data.fields[this.props.col.path];
		if (!value) return null;

		var display = getDisplay(value);

		return (
			<ItemsTableValue field={this.props.col.type}>
				{display}
			</ItemsTableValue>
		);
	},
	render () {
		return (
			<ItemsTableCell>
				{this.renderValue()}
			</ItemsTableCell>
		);
	},
});

module.exports = RelativeColumnColumn;
