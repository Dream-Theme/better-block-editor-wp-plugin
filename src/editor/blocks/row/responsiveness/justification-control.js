import {
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOptionIcon as ToggleGroupControlOptionIcon,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	justifyCenter,
	justifyLeft,
	justifyRight,
	justifySpaceBetween,
	justifyStretch,
} from '@wordpress/icons';
import { isOrientationHorizontal, JUSTIFICATION_VALUES } from './constants';

export default function JustificationControl( { justification, orientation, onChange } ) {
	const justificationOptions = [
		{
			value: JUSTIFICATION_VALUES.LEFT,
			icon: justifyLeft,
			label: __( 'Justify items left' ),
		},
		{
			value: JUSTIFICATION_VALUES.CENTER,
			icon: justifyCenter,
			label: __( 'Justify items center' ),
		},
		{
			value: JUSTIFICATION_VALUES.RIGHT,
			icon: justifyRight,
			label: __( 'Justify items right' ),
		},
	];

	// Add space between option only if the orientation is horizontal.
	if ( isOrientationHorizontal( orientation ) ) {
		justificationOptions.push( {
			value: JUSTIFICATION_VALUES.SPACE_BETWEEN,
			icon: justifySpaceBetween,
			label: __( 'Space between items' ),
		} );
	}
	// Add stretch option only if the orientation is vertical.
	else {
		justificationOptions.push( {
			value: JUSTIFICATION_VALUES.STRETCH,
			icon: justifyStretch,
			label: __( 'Stretch items' ),
		} );
	}

	return (
		<>
			<ToggleGroupControl
				__nextHasNoMarginBottom
				label={ __( 'Justification' ) }
				value={ justification }
				onChange={ ( value ) => onChange( { justification: value } ) }
				className="block-editor-hooks__flex-layout-justification-control"
			>
				{ justificationOptions.map( ( { value, icon, label } ) => {
					return (
						<ToggleGroupControlOptionIcon
							key={ value }
							value={ value }
							icon={ icon }
							label={ label }
						/>
					);
				} ) }
			</ToggleGroupControl>
		</>
	);
}
