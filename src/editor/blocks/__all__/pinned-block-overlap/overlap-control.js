import {
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOptionIcon as ToggleGroupControlOptionIcon,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { overlapBottom, overlapNone, overlapTop } from './icons';

export default function OverlapControl( { value, onChange, ...props } ) {
	const overlapOptions = {
		NONE: {
			value: 'none',
			icon: overlapNone,
			label: __( 'None', 'bbe' ),
			help: null,
		},
		TOP: {
			value: 'top',
			icon: overlapTop,
			label: __( 'Overlap top', 'bbe' ),
			help: __( 'The block will overlap the content after it.', 'bbe' ),
		},
		BOTTOM: {
			value: 'bottom',
			icon: overlapBottom,
			label: __( 'Overlap bottom', 'bbe' ),
			help: __( 'The block will overlap the content before it.', 'bbe' ),
		},
	};

	value = value ?? overlapOptions.NONE.value;

	return (
		<ToggleGroupControl
			__next40pxDefaultSize
			value={ value }
			onChange={ ( newValue ) => {
				onChange( newValue === overlapOptions.NONE.value ? undefined : newValue );
			} }
			help={
				Object.values( overlapOptions ).find( ( option ) => option.value === value )?.help
			}
			{ ...props }
		>
			{ Object.values( overlapOptions ).map( ( { value: optionValue, icon, label } ) => {
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
