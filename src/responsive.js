import { BREAKPOINT_OPTION_CUSTOM } from './components/responsive-breakpoint-control';
import { getUserBreakpoints } from '@dt-cr/editor/plugins/settings/editor';

function getUserDefinedBreakpoint( key ) {
	return getUserBreakpoints().find( ( el ) => el.key === key );
}

export function getUserDefinedBreakpointValue( breakpoint ) {
	return getUserDefinedBreakpoint( breakpoint )?.value;
}

export function isUserDefinedBreakpoint( breakpoint ) {
	return !! getUserDefinedBreakpoint( breakpoint );
}
export function isUserDefinedBreakpointActive( breakpoint ) {
	return getUserDefinedBreakpoint( breakpoint )?.active;
}

export function getSwitchWidth( breakpoint, breakpointValue ) {
	if ( breakpoint === BREAKPOINT_OPTION_CUSTOM ) {
		return breakpointValue;
	}

	// if there is user defined breakpoint for provided breakpoint key, return it's current value
	const userDefinedBreakpoint = getUserDefinedBreakpoint( breakpoint );
	if ( userDefinedBreakpoint ) {
		return userDefinedBreakpoint.value;
	}

	return undefined;
}
