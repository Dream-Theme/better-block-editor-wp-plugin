import { useAvailableUnits } from '@dt-cr/hooks/useAvailableUnits';
import { __experimentalUnitControl as UnitControl } from '@wordpress/components';

export default function ResponsiveBreakpointCustomValue( {
	value = '',
	onChange = ( v ) => v,
	...props
} ) {
	const units = useAvailableUnits();

	const defaultProps = {
		size: '__unstable-large',
		__nextHasNoMarginBottom: true,
		units,
	};
	return <UnitControl onChange={ onChange } value={ value } { ...defaultProps } { ...props } />;
}
