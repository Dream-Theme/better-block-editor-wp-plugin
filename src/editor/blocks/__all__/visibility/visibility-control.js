import {
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function VisibilityControl( { value = 'visible', onChange } ) {
	return (
		<>
			<ToggleGroupControl
				isBlock
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				size={ '__unstable-large' }
				label={ __( 'Block visibility', 'bbe' ) }
				value={ value || 'visible' } // support old way of setting visibility
				onChange={ onChange }
			>
				<ToggleGroupControlOption
					key={ 'visible' }
					value={ 'visible' }
					label={ __( 'Visible', 'bbe' ) }
				/>
				<ToggleGroupControlOption
					key={ 'hidden' }
					value={ 'hidden' }
					label={ __( 'Hidden', 'bbe' ) }
				/>
			</ToggleGroupControl>
		</>
	);
}
