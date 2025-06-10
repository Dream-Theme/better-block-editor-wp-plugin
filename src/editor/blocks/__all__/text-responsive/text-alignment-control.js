import {
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOptionIcon as ToggleGroupControlOptionIcon,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { alignCenter, alignLeft, alignRight } from '@wordpress/icons';
import { TEXT_ALIGNMENT_VALUES } from './constants';

export default function TextAlignmentControl( { value, onChange, ...props } ) {
	const options = {
		LEFT: {
			value: TEXT_ALIGNMENT_VALUES.LEFT,
			icon: alignLeft,
			label: __( 'Align text left', 'bbe' ),
		},
		TOP: {
			value: TEXT_ALIGNMENT_VALUES.CENTER,
			icon: alignCenter,
			label: __( 'Align text center', 'bbe' ),
		},
		BOTTOM: {
			value: TEXT_ALIGNMENT_VALUES.RIGHT,
			icon: alignRight,
			label: __( 'Align text right', 'bbe' ),
		},
	};

	return (
		<ToggleGroupControl
			__next40pxDefaultSize
			__nextHasNoMarginBottom
			value={ value }
			onChange={ onChange }
			{ ...props }
		>
			{ Object.values( options ).map( ( { value: optionValue, icon, label } ) => {
				return (
					<ToggleGroupControlOptionIcon
						key={ optionValue }
						value={ optionValue }
						icon={ icon }
						label={ label }
					/>
				);
			} ) }
		</ToggleGroupControl>
	);
}
