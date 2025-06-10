import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { RichTextToolbarButton, useSettings } from '@wordpress/block-editor';
import { Icon, color as colorIcon } from '@wordpress/icons';
import { removeFormat } from '@wordpress/rich-text';

import { useSelect } from '@wordpress/data';
import GradientUI from '@dt-cr/editor/formatting/text-gradient/component/gradient-ui';

const ALLOWED_BLOCKS = [ 'core/paragraph', 'core/heading' ];

const name = 'dt-cr/text-gradient';
const title = __( 'Text gradient', 'bbe' );

function TextGradientEdit( { value, onChange, isActive, activeAttributes, contentRef } ) {
	const selectedBlock = useSelect( ( select ) => {
		return select( 'core/block-editor' ).getSelectedBlock();
	}, [] );

	const [ isAddingColor, setIsAddingColor ] = useState( false );
	const [ allowCustomControl ] = useSettings( 'color.gradient' );

	if ( ! ALLOWED_BLOCKS.includes( selectedBlock.name ) ) {
		return null;
	}
	const hasColorsToChoose = ! allowCustomControl;
	return (
		<>
			<RichTextToolbarButton
				className="format-library-text-color-button"
				isActive={ isActive }
				icon={ <Icon icon={ colorIcon } /> }
				title={ title }
				// If it has no colors to choose but a color is active remove the color onClick.
				onClick={
					hasColorsToChoose
						? () => setIsAddingColor( true )
						: () => onChange( removeFormat( value, name ) )
				}
				role="menuitemcheckbox"
			/>
			{ isAddingColor && (
				<GradientUI
					name={ name }
					onClose={ () => setIsAddingColor( false ) }
					activeAttributes={ activeAttributes }
					value={ value }
					onChange={ onChange }
					contentRef={ contentRef }
					isActive={ isActive }
				/>
			) }
		</>
	);
}

export const textGradient = {
	name,
	title,
	tagName: 'span',
	className: 'text-with-gradient',
	attributes: {
		style: 'style',
		class: 'class',
	},
	edit: TextGradientEdit,
};
