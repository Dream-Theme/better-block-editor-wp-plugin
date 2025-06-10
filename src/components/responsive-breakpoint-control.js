import { CustomSelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { getUserBreakpoints } from '@dt-cr/editor/plugins/settings/editor';

export const BREAKPOINT_OPTION_OFF = '';
export const BREAKPOINT_OPTION_MOBILE = 'mobile';
export const BREAKPOINT_OPTION_TABLET = 'tablet';
export const BREAKPOINT_OPTION_CUSTOM = 'custom';

export default function ResponsiveBreakpointControl( {
	label = '',
	value = '',
	unsupportedValues = [],
	supportUserDefinedBreakpoints = true,
	onChange = ( v ) => v,
	...props
} ) {
	let options = [ { name: __( 'Off', 'bbe' ), key: BREAKPOINT_OPTION_OFF } ];

	// use only active user defined breakpoints
	if ( supportUserDefinedBreakpoints ) {
		getUserBreakpoints()
			.filter( ( el ) => el.active === true )
			.forEach( ( breakpoint ) => {
				options.push( {
					name: breakpoint.name,
					key: breakpoint.key,
				} );
			} );
	}

	// make "Custom" the last one
	options.push( { name: __( 'Custom', 'bbe' ), key: BREAKPOINT_OPTION_CUSTOM } );

	options = options.filter( ( el ) => ! unsupportedValues.includes( el.key ) );

	return (
		<div className="components-base-control">
			<CustomSelectControl
				{ ...props }
				label={ label }
				hideLabelFromVision={ ! label }
				value={
					options.find( ( option ) => option.key === value ) || options[ 0 ] // passing undefined here causes a downshift controlled/uncontrolled warning
				}
				options={ options }
				onChange={ ( selection ) => {
					onChange( selection.selectedItem.key );
				} }
				size={ '__unstable-large' }
			/>
			{ props.help && <p className="components-base-control__help">{ props.help }</p> }
		</div>
	);
}
