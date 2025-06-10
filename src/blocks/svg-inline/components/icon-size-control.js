/**
 * WordPress dependencies
 */
import {
	__experimentalUnitControl as UnitControl,
	__experimentalUseCustomUnits as useCustomUnits,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';

export default function IconSizeControl( { defaultSize, size, onChange } ) {
	const [ currentSize, setCurrentSize ] = useState( size ?? defaultSize ?? '' );

	// When an image is first inserted, the default dimensions are initially
	// undefined. This effect updates the dimensions when the default values
	// come through.
	useEffect( () => {
		if ( size === undefined && defaultSize !== undefined ) {
			setCurrentSize( defaultSize );
		}
	}, [ size, defaultSize ] );

	// If custom values change, it means an outsider has resized the image using some other method (eg resize box)
	// this keeps track of these values too. We need to parse before comparing; custom values can be strings.
	useEffect( () => {
		if ( size !== undefined && size !== currentSize ) {
			setCurrentSize( size );
		}
	}, [ size, currentSize ] );
	const updateDimension = ( dimension, value ) => {
		const isValid = /^([\d.]+)([a-z%]*)$/.test( value ) || value === '';

		if ( ! isValid ) {
			return;
		}
		const parsedValue = value === '' ? undefined : value;
		if ( dimension === 'size' ) {
			setCurrentSize( parsedValue );
		} else {
			return;
		}
		onChange( parsedValue );
	};
	const units = useCustomUnits( {
		availableUnits: [ 'px' ],
	} );

	const defaultProps = {
		labelPosition: 'top',
		size: '__unstable-large',
		__nextHasNoMarginBottom: true,
		units,
		placeholder: __( 'Auto', 'bbe' ),
		min: 1,
	};

	return (
		<div className="block-editor-image-size-control">
			<UnitControl
				label={ __( 'Icon Size', 'bbe' ) }
				value={ currentSize }
				onChange={ ( value ) => updateDimension( 'size', value ) }
				{ ...defaultProps }
			/>
		</div>
	);
}
