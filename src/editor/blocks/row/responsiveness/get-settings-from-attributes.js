import { BREAKPOINT_OPTION_OFF } from '@dt-cr/components/responsive-breakpoint-control';
import { JUSTIFICATION_VALUES, ORIENTATION_VALUES, VERTICAL_ALIGNMENT_VALUES } from './constants';

/**
 * get default responsiveness orientation and justification settings from attributes.layout
 * @param {*} attributes
 * @return {Object} { breakpoint, breakpointCustomValue, justification, orientation }
 */
export default function getSettingsFromAttributes( attributes ) {
	const defaults = {
		breakpoint: BREAKPOINT_OPTION_OFF,
		breakpointCustomValue: undefined,
		justification: attributes?.layout?.justifyContent ?? JUSTIFICATION_VALUES.LEFT,
		orientation:
			attributes?.layout?.orientation === 'vertical'
				? ORIENTATION_VALUES.COLUMN
				: ORIENTATION_VALUES.ROW,
		verticalAlignment: VERTICAL_ALIGNMENT_VALUES.TOP,
		gap: undefined,
	};

	const current = attributes?.dtCrResponsive ?? {};

	// overwrite defaults with current values if defined
	return {
		breakpoint: current.breakpoint ?? defaults.breakpoint,
		breakpointCustomValue: current.breakpointCustomValue ?? defaults.breakpointCustomValue,
		justification: current.justification ?? defaults.justification,
		orientation: current.orientation ?? defaults.orientation,
		verticalAlignment: current.verticalAlignment ?? defaults.verticalAlignment,
		gap: current.gap ?? defaults.gap,
	};
}
