import { __experimentalUseCustomUnits as useCustomUnits } from '@wordpress/components';

export function useAvailableUnits() {
	return useCustomUnits( {
		availableUnits: [ 'px', 'em', 'rem', 'vw', 'vh' ],
	} );
}
