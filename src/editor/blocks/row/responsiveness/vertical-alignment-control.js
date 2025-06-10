import {
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOptionIcon as ToggleGroupControlOptionIcon,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	justifyBottom,
	justifyCenterVertical,
	justifySpaceBetweenVertical,
	justifyStretchVertical,
	justifyTop,
} from '@wordpress/icons';
import { isOrientationHorizontal, VERTICAL_ALIGNMENT_VALUES } from './constants';

const COMMON_OPTIONS = [
	{
		value: VERTICAL_ALIGNMENT_VALUES.TOP,
		icon: justifyTop,
		label: __( 'Align top' ),
	},
	{
		value: VERTICAL_ALIGNMENT_VALUES.MIDDLE,
		icon: justifyCenterVertical,
		label: __( 'Align middle' ),
	},
	{
		value: VERTICAL_ALIGNMENT_VALUES.BOTTOM,
		icon: justifyBottom,
		label: __( 'Align bottom' ),
	},
];

const ROW_OPTIONS = [
	...COMMON_OPTIONS,
	{
		value: VERTICAL_ALIGNMENT_VALUES.STRETCH,
		icon: justifyStretchVertical,
		label: __( 'Streth to fill' ),
	},
];

const COLUMN_OPTIONS = [
	...COMMON_OPTIONS,
	{
		value: VERTICAL_ALIGNMENT_VALUES.SPACE_BETWEEN,
		icon: justifySpaceBetweenVertical,
		label: __( 'Space between' ),
	},
];

export default function VerticalAlignmentControl( { verticalAlignment, orientation, onChange } ) {
	const options = isOrientationHorizontal( orientation ) ? ROW_OPTIONS : COLUMN_OPTIONS;

	return (
		<ToggleGroupControl
			__nextHasNoMarginBottom
			label={ __( 'Vertical alignment' ) }
			value={ verticalAlignment }
			onChange={ ( value ) => onChange( { verticalAlignment: value } ) }
			className="block-editor-hooks__flex-layout-vertical-alignment-control"
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
	);
}
