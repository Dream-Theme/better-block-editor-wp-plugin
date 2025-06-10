import ResponsiveBreakpointControl, {
	BREAKPOINT_OPTION_CUSTOM,
} from '@dt-cr/components/responsive-breakpoint-control';
import ResponsiveBreakpointCustomValue from '@dt-cr/components/responsive-breakpoint-custom-value';
import { useHandleDeletedUserBreakpoint } from '@dt-cr/hooks/useHandleDeletedUserBreakpoint';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import VisibilityControl from './visibility-control';

export default function VisibilitySettings( { props } ) {
	const { attributes, setAttributes } = props;

	const { dtCrVisibility } = attributes;
	const { visibility, breakpoint, breakpointCustomValue } = dtCrVisibility || {};

	function handleChange( values ) {
		setAttributes( {
			dtCrVisibility: { ...dtCrVisibility, ...values },
		} );
	}

	// if breakpoint was deactivated by user, reset to custom one with the same breakpoint value
	useHandleDeletedUserBreakpoint( breakpoint, ( newValue ) =>
		handleChange( {
			breakpoint: BREAKPOINT_OPTION_CUSTOM,
			breakpointCustomValue: newValue,
		} )
	);

	useEffect( () => {
		if ( visibility !== 'hidden' && ! breakpoint ) {
			setAttributes( {
				dtCrVisibility: undefined,
			} );
		}
	}, [ setAttributes, visibility, breakpoint ] );

	const helpText =
		visibility === 'hidden'
			? __( 'Show block at this breakpoint and below.', 'bbe' )
			: __( 'Hide block at this breakpoint and below.', 'bbe' );

	return (
		<>
			<VisibilityControl
				value={ visibility }
				onChange={ ( value ) => handleChange( { visibility: value } ) }
			/>

			<ResponsiveBreakpointControl
				label={ __( 'Breakpoint', 'bbe' ) }
				value={ breakpoint }
				onChange={ ( value ) => {
					handleChange( {
						breakpoint: value,
						breakpointCustomValue: undefined,
					} );
				} }
				help={ breakpoint !== BREAKPOINT_OPTION_CUSTOM ? helpText : null }
			/>
			{ breakpoint === BREAKPOINT_OPTION_CUSTOM && (
				<ResponsiveBreakpointCustomValue
					onChange={ ( value ) => {
						handleChange( {
							breakpointCustomValue: value,
						} );
					} }
					value={ breakpointCustomValue }
					help={ helpText }
				/>
			) }
		</>
	);
}
