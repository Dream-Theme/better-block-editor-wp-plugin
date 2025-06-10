import {
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOptionIcon as ToggleGroupControlOptionIcon,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import { arrowDown, arrowLeft, arrowRight, arrowUp } from '@wordpress/icons';
import { ORIENTATION_VALUES } from './constants';

const options = [
	{
		value: ORIENTATION_VALUES.ROW,
		icon: arrowRight,
		label: __( 'Horizontal' ),
	},
	{
		value: ORIENTATION_VALUES.COLUMN,
		icon: arrowDown,
		label: __( 'Vertical' ),
	},
	{
		value: ORIENTATION_VALUES.ROW_REVERSE,
		icon: arrowLeft,
		label: __( 'Horizontal inversed' ),
	},
	{
		value: ORIENTATION_VALUES.COLUMN_REVERSE,
		icon: arrowUp,
		label: __( 'Vertical inversed' ),
	},
];

export default function OrientationControl( { orientation, onChange } ) {
	return (
		<>
			<ToggleGroupControl
				__nextHasNoMarginBottom
				label={ __( 'Orientation' ) }
				value={ orientation }
				onChange={ ( value ) => onChange( { orientation: value } ) }
				className="block-editor-hooks__flex-layout-orientation-control"
			>
				{ options.map( ( { value, icon, label } ) => {
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
