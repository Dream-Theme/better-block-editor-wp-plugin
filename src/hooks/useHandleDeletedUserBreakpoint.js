import {
	getUserDefinedBreakpointValue,
	isUserDefinedBreakpoint,
	isUserDefinedBreakpointActive,
} from '@dt-cr/responsive';
import { useEffect } from '@wordpress/element';

export function useHandleDeletedUserBreakpoint( breakpoint, handler ) {
	useEffect( () => {
		if (
			isUserDefinedBreakpoint( breakpoint ) &&
			! isUserDefinedBreakpointActive( breakpoint )
		) {
			handler( getUserDefinedBreakpointValue( breakpoint ) );
		}
	}, [ handler, breakpoint ] );
}
