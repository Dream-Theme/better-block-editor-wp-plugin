import { store as blockEditorStore } from '@wordpress/block-editor';
import { BaseControl } from '@wordpress/components';
import { select } from '@wordpress/data';
import './index.scss';

const TEMPLATE_PART_BLOCK_NAME = 'core/template-part';

/*
 * The only purpose of this component is to hide help message
 * for sticky block in case it's first child of header template part.
 * Hide logic is in CSS
 */
export default function HidePositionStickyHelp( { stickyBlockClientId } ) {
	const firstParentClientId = select( blockEditorStore ).getBlockParents(
		stickyBlockClientId,
		true
	)[ 0 ];

	const blockInfo = select( blockEditorStore ).getBlock( firstParentClientId );

	return (
		blockInfo?.name === TEMPLATE_PART_BLOCK_NAME && (
			<BaseControl.VisualLabel className="dt-cr__hide-position-help" />
		)
	);
}
