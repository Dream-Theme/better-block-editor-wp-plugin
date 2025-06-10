import { useAvailableUnits } from '@dt-cr/hooks/useAvailableUnits';
import { __experimentalSpacingSizesControl as SpacingSizesControl } from '@wordpress/block-editor';

export default function BlockSpacingControl( { value, label, onChange, ...props } ) {
	const units = useAvailableUnits();

	return (
		<SpacingSizesControl
			values={ { all: value } }
			onChange={ ( newValue ) => onChange( newValue.all ) }
			label={ label }
			sides={ [ 'all' ] }
			units={ units }
			showSideInLabel={ false }
			{ ...props }
		/>
	);
}
