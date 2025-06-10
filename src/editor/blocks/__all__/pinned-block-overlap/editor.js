import HidePositionStickyHelp from '@dt-cr/components/HidePositionStickyHelp';
import { addCssClasses } from '@dt-cr/css-classes-utils';
import { findOneInAllBlockEditors, getEditorDocument } from '@dt-cr/utils/editor-iframe-dom-utils';
import { useIsTemplateList } from '@dt-cr/utils/use-is-template-list';
import { isBlockFullyEditable } from '@dt-cr/utils/utils';
import { InspectorControls } from '@wordpress/block-editor';
import { createHigherOrderComponent } from '@wordpress/compose';
import { select } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useEffect } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import './editor.scss';
import OverlapControl from './overlap-control';

const UNSUPPORTED_POST_TYPES = [ 'wp_template_part' ];

// eslint-disable-next-line no-undef
const resizeObserver = new ResizeObserver( ( entries ) => {
	// need this to avoid ResizeObserver errors about not processed events
	window.requestAnimationFrame( () => {
		entries.forEach( ( entry ) => {
			const offset = '-' + entry.target.getBoundingClientRect().height + 'px';
			entry.target.style.setProperty( '--wp--pinned-block-overlap', offset );
		} );
	} );
} );

function needToApplyChanges( attributes ) {
	return attributes?.style?.position?.type === 'sticky';
}

function modifyBlockData( settings ) {
	return {
		...settings,
		attributes: {
			...settings.attributes,
			dtCrPinnedOverlap: {
				type: 'string',
			},
		},
	};
}

const extendBlockEdit = createHigherOrderComponent( ( BlockEdit ) => {
	return ( props ) => {
		const {
			attributes,
			attributes: { dtCrPinnedOverlap: overlap = undefined },
			setAttributes,
			isSelected,
			clientId,
		} = props;

		useEffect( () => {
			if ( ! needToApplyChanges( attributes ) && ! overlap ) {
				return;
			}

			// in case it's template list we need to search element among all block editors
			const element =
				needToApplyChanges( attributes ) && overlap && useIsTemplateList()
					? findOneInAllBlockEditors( `#block-${ clientId }` )
					: getEditorDocument().querySelector( `[data-block="${ clientId }"]` );

			// in some cases there is NO such element it block editor yet (copy, transform preview)
			if ( element ) {
				if ( needToApplyChanges( attributes ) && overlap ) {
					resizeObserver.observe( element, { box: 'border-box' } );
				} else {
					resizeObserver.unobserve( element );
				}
			}

			// if sticky position was removed we need to remove our settings
			if ( ! needToApplyChanges( attributes ) && overlap ) {
				setAttributes( { dtCrPinnedOverlap: undefined } );
			}

			// we do not remove element from observer here
			// as when block is removed it's not a problem and if block still exists
			// we initiate "unobserve" / "observe" during any changes which has no sense
		}, [ clientId, overlap, attributes, setAttributes ] );

		if ( ! needToApplyChanges( attributes ) || ! isBlockFullyEditable( clientId ) ) {
			return <BlockEdit { ...props } />;
		}

		return (
			<>
				<BlockEdit { ...props } />

				{ isSelected && (
					<InspectorControls group="position">
						<OverlapControl
							label={ __( 'Overlap', 'bbe' ) }
							value={ overlap }
							onChange={ ( value ) => {
								setAttributes( { dtCrPinnedOverlap: value } );
							} }
							className="dt-cr__pinned-block-overlap-control"
							__nextHasNoMarginBottom
						/>
						<HidePositionStickyHelp stickyBlockClientId={ clientId } />
					</InspectorControls>
				) }
			</>
		);
	};
}, 'extendBlockEdit' );

const renderInEditor = createHigherOrderComponent(
	( BlockListBlock ) => ( props ) => {
		const {
			attributes,
			attributes: { dtCrPinnedOverlap: overlap = undefined },
			className,
		} = props;

		// for template parts we need to avoid implementing overlap in block editor
		// as it brokes template part layout
		// it can not be done in needToApplyChanges as in our case changes have to be saved
		// but not applied to block editor view (shown) in template part posts only
		const postTypeSupported = ! UNSUPPORTED_POST_TYPES.includes(
			select( editorStore ).getCurrentPostType()
		);

		if ( ! needToApplyChanges( attributes ) || ! overlap || ! postTypeSupported ) {
			return <BlockListBlock { ...props } />;
		}

		return (
			<BlockListBlock
				{ ...props }
				className={ addCssClasses( className, 'is-overlap-' + overlap ) }
			/>
		);
	},
	'renderInEditor'
);

addFilter(
	'blocks.registerBlockType',
	'dt-cr/__all__/pinned-block-overlap/modify-block-data',
	modifyBlockData
);

addFilter( 'editor.BlockEdit', 'dt-cr/__all__/pinned-block-overlap/edit-block', extendBlockEdit );

addFilter(
	'editor.BlockListBlock',
	'dt-cr/__all__/pinned-block-overlap/render-in-editor',
	renderInEditor
);
