import ResponsiveBreakpointControl, {
	BREAKPOINT_OPTION_CUSTOM,
	BREAKPOINT_OPTION_OFF,
} from '@dt-cr/components/responsive-breakpoint-control';
import ResponsiveBreakpointCustomValue from '@dt-cr/components/responsive-breakpoint-custom-value';
import { useHandleDeletedUserBreakpoint } from '@dt-cr/hooks/useHandleDeletedUserBreakpoint';
import { getUserDefinedBreakpointValue } from '@dt-cr/responsive';
import { __ } from '@wordpress/i18n';
import {
	isOrientationHorizontal,
	isOrientationVertical,
	JUSTIFICATION_VALUES,
	VERTICAL_ALIGNMENT_VALUES,
} from './constants';
import getSettingsFromAttributes from './get-settings-from-attributes';
import JustificationControl from './justification-control';
import OrientationControl from './orientation-control';
import VerticalAlignmentControl from './vertical-alignment-control';
import BlockSpacingControl from '@dt-cr/components/block-spacing-control';

export default function StretchWidthSettings( { props } ) {
	const { attributes, setAttributes } = props;

	const dtCrResponsive = getSettingsFromAttributes( attributes );
	const {
		breakpoint,
		breakpointCustomValue,
		justification,
		orientation,
		verticalAlignment,
		gap,
	} = dtCrResponsive;

	// if breakpoint was deactivated by user, reset to custom one with the same breakpoint value
	useHandleDeletedUserBreakpoint( breakpoint, ( newValue ) => {
		setAttributes( {
			dtCrResponsive: {
				...dtCrResponsive,
				breakpoint: BREAKPOINT_OPTION_CUSTOM,
				breakpointCustomValue: newValue,
			},
		} );
	} );

	function handleAttrChange( values ) {
		if ( values.breakpoint === BREAKPOINT_OPTION_OFF ) {
			values.justification = undefined;
			values.orientation = undefined;
			values.verticalAlignment = undefined;
			values.gap = undefined;
		}

		// if justification or verticalAlignment in not supported for this orientation
		// reset justification or verticalAlignment value to "default"

		if ( isOrientationHorizontal( values.orientation ) ) {
			if ( dtCrResponsive.justification === JUSTIFICATION_VALUES.STRETCH ) {
				values.justification = JUSTIFICATION_VALUES.LEFT;
			}
			// this logic is copied from core row/stack origin and justification
			if ( dtCrResponsive.verticalAlignment === VERTICAL_ALIGNMENT_VALUES.SPACE_BETWEEN ) {
				values.verticalAlignment = VERTICAL_ALIGNMENT_VALUES.MIDDLE;
			}
		}

		if ( isOrientationVertical( values.orientation ) ) {
			if ( dtCrResponsive.justification === JUSTIFICATION_VALUES.SPACE_BETWEEN ) {
				values.justification = JUSTIFICATION_VALUES.LEFT;
			}

			if ( dtCrResponsive.verticalAlignment === VERTICAL_ALIGNMENT_VALUES.STRETCH ) {
				values.verticalAlignment = VERTICAL_ALIGNMENT_VALUES.TOP;
			}
		}

		setAttributes( {
			dtCrResponsive: { ...dtCrResponsive, ...values },
		} );
	}

	const helpText = __(
		'Change orientation and other related settings at this breakpoint and below.',
		'bbe'
	);

	return (
		<>
			<ResponsiveBreakpointControl
				label={ __( 'Breakpoint', 'bbe' ) }
				value={ breakpoint }
				onChange={ ( value ) => {
					handleAttrChange( {
						breakpoint: value,
						breakpointCustomValue:
							value === BREAKPOINT_OPTION_CUSTOM
								? getUserDefinedBreakpointValue( value )
								: undefined,
					} );
				} }
				help={ breakpoint !== BREAKPOINT_OPTION_CUSTOM ? helpText : null }
			/>
			{ breakpoint === BREAKPOINT_OPTION_CUSTOM && (
				<ResponsiveBreakpointCustomValue
					onChange={ ( value ) => handleAttrChange( { breakpointCustomValue: value } ) }
					value={ breakpointCustomValue }
					help={ helpText }
				/>
			) }

			{ breakpoint && (
				<>
					<OrientationControl
						justification={ justification }
						orientation={ orientation }
						onChange={ handleAttrChange }
					/>

					<JustificationControl
						justification={ justification }
						orientation={ orientation }
						onChange={ handleAttrChange }
					/>

					<VerticalAlignmentControl
						verticalAlignment={ verticalAlignment }
						orientation={ orientation }
						onChange={ handleAttrChange }
					/>

					<BlockSpacingControl
						value={ gap }
						label={ __( 'Block spacing', 'bbe' ) }
						onChange={ ( newValue ) => handleAttrChange( { gap: newValue } ) }
					/>
				</>
			) }
		</>
	);
}
