import Field from '../Field';
import React from 'react';
import { FormRow, FormField, FormInput, Button, Modal } from 'elemental';
import { Map, Marker, Popup, TileLayer } from 'react-leaflet';

module.exports = Field.create({

	displayName: 'GeopointField',
	statics: {
		type: 'Geopoint',
	},

	focusTargetRef: 'lat',

	handleLat (event) {
		const { value = [], path, onChange } = this.props;
		const newVal = event.target.value;
		onChange({
			path,
			value: [value[0], newVal],
		});
	},

	handleLong (event) {
		const { value = [], path, onChange } = this.props;
		const newVal = event.target.value;
		onChange({
			path,
			value: [newVal, value[1]],
		});
	},

	renderValue () {
		const { value } = this.props;
		if (value && value[1] && value[0]) {
			return <FormInput noedit>{value[1]}, {value[0]}</FormInput>; // eslint-disable-line comma-spacing
		}
		return <FormInput noedit>(not set)</FormInput>;
	},

	renderField () {
		const { value = [], path } = this.props;
		const position = this.stagingCenter;
		return (
			<FormRow>
				<FormField width="one-third">
					<FormInput name={this.getInputName(path + '[1]')} placeholder="Latitude" ref="lat" value={value[1]} onChange={this.handleLat} autoComplete="off" />
				</FormField>
				<FormField width="one-third">
					<FormInput name={this.getInputName(path + '[0]')} placeholder="Longitude" ref="lng" value={value[0]} onChange={this.handleLong} autoComplete="off" />
				</FormField>
				<FormField width="one-third">
					<Button onClick={this.onPick}>
						Pick
					</Button>
				</FormField>
				<Modal
					isOpen={this.state.showPicker}
					onCancel={this.props.onCancel}
					backdropClosesModal
				>
					<Modal.Header
						text={'Drag to move, scroll to zoom'}
						onClose={this.onCancel}
						showCloseButton
					/>
					<Modal.Body>
						<Map ref={this.selectorMapMounted} center={position} zoom={13}>
							<TileLayer
								url='http://{s}.tile.osm.org/{z}/{x}/{y}.png'
								attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'/>
						</Map>
					</Modal.Body>
					<Modal.Footer>
						<Button onClick={this.onCancel}>
							取消
						</Button>
						<Button onClick={this.onConfirm}>
							确定
						</Button>
					</Modal.Footer>
				</Modal>
			</FormRow>
		);
	},

	onPick() {
		this.setState({showPicker: true});
	},

	onCancel() {
		this.setState({showPicker: false});
	},

	onConfirm() {
		const { value = [], path, onChange } = this.props;
		var center = this.refs.selectorMap.leafletElement.getCenter();
		var centerArray = [center.lng, center.lat];
		onChange({
			path,
			value: centerArray,
		});
		this.setState({
			showPicker: false,
		});
	},

	componentDidMount() {
		const { value = [] } = this.props;
		this.stagingCenter = [value[1], value[0]];
	},

	selectorMapMounted(selectorMap) {
		this.refs.selectorMap = selectorMap;
		if(selectorMap){
			L.control.mapCenterCoord().addTo(this.refs.selectorMap.leafletElement);
		}
	}
});
