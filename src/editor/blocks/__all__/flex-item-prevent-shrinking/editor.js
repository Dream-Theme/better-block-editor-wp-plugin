import { addCssClasses } from '@dt-cr/css-classes-utils';
import { isBlockFullyEditable } from '@dt-cr/utils/utils';
import { InspectorControls } from '@wordpress/block-editor';
import { ToggleControl } from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import { select } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import './editor.scss';

function isParentLayoutFlex( clientId ) {
	const parents = select( 'core/block-editor' ).getBlockParents( clientId, true );
	const parentClientId = parents[ 0 ] ?? undefined;

	if ( ! parentClientId ) {
		return false;
	}

	const parentAttributes = select( 'core/block-editor' ).getBlockAttributes( parentClientId );

	return parentAttributes?.layout?.type === 'flex';
}

function modifyBlockData( settings ) {
	return {
		...settings,
		attributes: {
			...settings.attributes,
			dtCrFlexItemPreventShrinking: {
				type: 'boolean',
			},
		},
	};
}

const extendBlockEdit = createHigherOrderComponent( ( BlockEdit ) => {
	return ( props ) => {
		const {
			attributes,
			setAttributes,
			clientId,
			__unstableParentLayout: parentLayout = {},
		} = props;

		const layoutSelfStretch = attributes?.style?.layout?.selfStretch;
		// for Grow mode (value = fill) don't show switch and turn off prevent shrinking
		useEffect( () => {
			if ( layoutSelfStretch === 'fill' ) {
				setAttributes( {
					dtCrFlexItemPreventShrinking: undefined,
				} );
			}
		}, [ layoutSelfStretch, setAttributes ] );

		// in case it's parent layout is not flex don't show switch at all
		if ( ! ( parentLayout?.type === 'flex' && parentLayout?.allowSizingOnChildren === true ) ) {
			return <BlockEdit { ...props } />;
		}

		// in case it's fill don't show switch at all
		if ( layoutSelfStretch === 'fill' || ! isBlockFullyEditable( clientId ) ) {
			return <BlockEdit { ...props } />;
		}

		return (
			<>
				<BlockEdit { ...props } />
				<InspectorControls group="dimensions">
					<ToggleControl
						__nextHasNoMarginBottom
						checked={ attributes?.dtCrFlexItemPreventShrinking ? true : false }
						onChange={ ( value ) => {
							setAttributes( {
								dtCrFlexItemPreventShrinking: value === true ? true : undefined,
							} );
						} }
						label={ __( 'Prevent shrinking', 'bbe' ) }
						className="dt-cr__all__flex-item-prevent-shrinking"
					/>
				</InspectorControls>
			</>
		);
	};
}, 'extendBlockEdit' );

/**
 * Here we check if block is parent layout flex and if it is not, we remove dtCrFlexItemPreventShrinking
 * It's done to avoid dtCrFlexItemPreventShrinking=true when block copy pasted to another parent so classes
 * added to prevent shrinking may cause unwanted side effects
 */
const renderInEditor = createHigherOrderComponent(
	( BlockListBlock ) => ( props ) => {
		const { attributes, clientId, className = '', setAttributes } = props;
		const preventShrinkingEnabled = attributes?.dtCrFlexItemPreventShrinking ?? false;

		useEffect( () => {
			// we check for block existance as during implementation of FSE-16
			// we found that when post->template->swap template opens content preview in template
			// editor generate new clientId, problem is that block has no parents at this moment
			// so we check for block existance on page to avoid redundant disabling dtCrFlexItemPreventShrinking
			// when preview is opened
			const blockExists = select( 'core/block-editor' ).getBlockIndex( clientId ) !== -1;

			if ( blockExists && preventShrinkingEnabled && ! isParentLayoutFlex( clientId ) ) {
				setAttributes( {
					dtCrFlexItemPreventShrinking: undefined,
				} );
			}
		}, [ preventShrinkingEnabled, clientId, setAttributes ] );

		return (
			<BlockListBlock
				{ ...props }
				className={ addCssClasses(
					className,
					preventShrinkingEnabled ? 'dt-cr__flex-item-prevent-shrinking' : ''
				) }
			/>
		);
	},
	'renderInEditor'
);

addFilter(
	'blocks.registerBlockType',
	'dt-cr/__all__/flex-item-prevent-shrinking/modify-block-data',
	modifyBlockData
);

addFilter(
	'editor.BlockEdit',
	'dt-cr/__all__/flex-item-prevent-shrinking/edit-block',
	extendBlockEdit
);

addFilter(
	'editor.BlockListBlock',
	'dt-cr/__all__/flex-item-prevent-shrinking/render-in-editor',
	renderInEditor
);
