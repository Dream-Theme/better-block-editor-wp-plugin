import { addCssClasses } from '@dt-cr/css-classes-utils';
import { useColorInputUtils } from '@dt-cr/hooks/use-color-input-utils';
import { extendWrapperPropsStyle, isBlockFullyEditable } from '@dt-cr/utils/utils';
import { InspectorControls, PanelColorSettings } from '@wordpress/block-editor';
import { createHigherOrderComponent } from '@wordpress/compose';
import { select } from '@wordpress/data';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import './editor.scss';

const BLOCK_NAME = 'core/navigation';
// don't show styling on change navigation menu post types
// as they have another purpose and not support changing navigation block attributes
const UNSUPPORTED_POST_TYPES = [ 'wp_navigation' ];

function needToApplyChanges( props ) {
	const postType = select( 'core/editor' ).getCurrentPostType();

	return props.name === BLOCK_NAME && ! UNSUPPORTED_POST_TYPES.includes( postType );
}

function modifyBlockData( settings, name ) {
	if ( name !== BLOCK_NAME ) {
		return settings;
	}

	return {
		...settings,
		attributes: {
			...settings.attributes,
			// we can not group them in one object here because under the hood in control component
			// wp-data/regstry.batch is used to implement "Reset All" functionality
			// and it doesn't work if attributes are in one object
			// see https://github.com/WordPress/gutenberg/blob/d516b2350df88ccdb4ad10e00608b13c6ff7c6d8/packages/block-editor/src/components/colors-gradients/panel-color-gradient-settings.js
			dtCrMenuHoverColor: {
				type: 'string',
			},
			dtCrSubmenuHoverColor: {
				type: 'string',
			},
		},
	};
}

const extendBlockEdit = createHigherOrderComponent( ( BlockEdit ) => {
	return ( props ) => {
		const { setAttributes, clientId } = props;

		const { dtCrMenuHoverColor, dtCrSubmenuHoverColor } = props.attributes;

		const { attributeToInput, inputToAttribute } = useColorInputUtils();

		if ( ! needToApplyChanges( props ) || ! isBlockFullyEditable( clientId ) ) {
			return <BlockEdit { ...props } />;
		}

		return (
			<>
				<BlockEdit { ...props } />

				<InspectorControls group="styles">
					<PanelColorSettings
						__experimentalIsRenderedInSidebar
						title={ __( 'Hover Color', 'bbe' ) }
						className="navigation-hover-color-block-support-panel"
						colorSettings={ [
							{
								value: attributeToInput( dtCrMenuHoverColor ),
								onChange: ( value ) =>
									setAttributes( {
										dtCrMenuHoverColor: inputToAttribute( value ),
									} ),

								label: __( 'Hover', 'bbe' ),
							},
							{
								value: attributeToInput( dtCrSubmenuHoverColor ),
								onChange: ( value ) =>
									setAttributes( {
										dtCrSubmenuHoverColor: inputToAttribute( value ),
									} ),
								label: __( 'Submenu & overlay hover', 'bbe' ),
							},
						] }
					/>
				</InspectorControls>
			</>
		);
	};
}, 'extendBlockEdit' );

const renderInEditor = createHigherOrderComponent( ( BlockListBlock ) => {
	return ( props ) => {
		if ( ! needToApplyChanges( props ) ) {
			return <BlockListBlock { ...props } />;
		}

		const { dtCrMenuHoverColor, dtCrSubmenuHoverColor } = props.attributes;
		const { attributeToCss } = useColorInputUtils();

		const varsDefinition = {};

		if ( dtCrMenuHoverColor ) {
			varsDefinition[ '--wp-navigation-hover' ] = attributeToCss( dtCrMenuHoverColor );
		}

		if ( dtCrSubmenuHoverColor ) {
			varsDefinition[ '--wp-navigation-submenu-hover' ] =
				attributeToCss( dtCrSubmenuHoverColor );
		}

		return (
			<>
				<BlockListBlock
					{ ...props }
					wrapperProps={ extendWrapperPropsStyle( props?.wrapperProps, varsDefinition ) }
					className={ addCssClasses(
						props.className,
						( dtCrMenuHoverColor ? ' has-hover ' : '' ) +
							( dtCrSubmenuHoverColor ? 'has-submenu-hover' : '' )
					) }
				/>
			</>
		);
	};
}, 'renderInEditor' );

addFilter(
	'blocks.registerBlockType',
	'dt-cr/navigation/hover-colors/modify-block-data',
	modifyBlockData
);

addFilter( 'editor.BlockEdit', 'dt-cr/navigation/hover-colors/edit-block', extendBlockEdit );

addFilter(
	'editor.BlockListBlock',
	'dt-cr/navigation/hover-colors/render-in-editor',
	renderInEditor
);
