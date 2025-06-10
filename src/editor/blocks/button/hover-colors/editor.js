import { addCssClasses } from '@dt-cr/css-classes-utils';
import { useColorInputUtils } from '@dt-cr/hooks/use-color-input-utils';
import { extendWrapperPropsStyle, isBlockFullyEditable } from '@dt-cr/utils/utils';
import { InspectorControls, PanelColorSettings } from '@wordpress/block-editor';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useEffect, useState } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import './editor.scss';

const BLOCK_NAME = 'core/button';

function needToApplyChanges( props ) {
	return props.name === BLOCK_NAME;
}

function modifyBlockData( settings, name ) {
	if ( name !== BLOCK_NAME ) {
		return settings;
	}

	return {
		...settings,
		attributes: {
			...settings.attributes,
			dtCrHoverColor: {
				text: { type: 'string' },
				background: { type: 'string' },
				border: { type: 'string' },
			},
		},
	};
}

const extendBlockEdit = createHigherOrderComponent( ( BlockEdit ) => {
	return ( props ) => {
		const { attributeToInput, inputToAttribute } = useColorInputUtils();
		const { setAttributes, clientId } = props;

		const { dtCrHoverColor = {} } = props.attributes;
		// this useState and then setAttributes in useEffect() is to solve issue with "reset all" feature
		// which uses batched update (wp-data/regstry.batch) under the hood
		// seehttps://github.com/WordPress/gutenberg/blob/d516b2350df88ccdb4ad10e00608b13c6ff7c6d8/packages/block-editor/src/components/colors-gradients/panel-color-gradient-settings.js
		const [ textColor, setTextColor ] = useState( dtCrHoverColor.text );
		const [ backgroundColor, setBackgroundColor ] = useState( dtCrHoverColor.background );
		const [ borderColor, setBorderColor ] = useState( dtCrHoverColor.border );

		useEffect( () => {
			// only update attributes if value was actually changed
			if (
				textColor !== dtCrHoverColor.text ||
				backgroundColor !== dtCrHoverColor.background ||
				borderColor !== dtCrHoverColor.border
			) {
				setAttributes( {
					dtCrHoverColor: {
						text: textColor,
						background: backgroundColor,
						border: borderColor,
					},
				} );
			}
		}, [
			textColor,
			backgroundColor,
			borderColor,
			setAttributes,
			dtCrHoverColor.text,
			dtCrHoverColor.background,
			dtCrHoverColor.border,
		] );

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
						className="button-hover-color-block-support-panel"
						enableAlpha
						colorSettings={ [
							{
								value: attributeToInput( textColor ),
								onChange: ( value ) => setTextColor( inputToAttribute( value ) ),
								label: __( 'Text', 'bbe' ),
							},
							{
								value: attributeToInput( backgroundColor ),
								onChange: ( value ) =>
									setBackgroundColor( inputToAttribute( value ) ),
								label: __( 'Background', 'bbe' ),
							},
							{
								value: attributeToInput( borderColor ),
								onChange: ( value ) => setBorderColor( inputToAttribute( value ) ),
								label: __( 'Border', 'bbe' ),
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

		const { attributeToCss } = useColorInputUtils();
		const hoverSettings = [ 'text', 'background', 'border' ];
		const { dtCrHoverColor = {} } = props.attributes;

		const varsDefinition = {};
		let hoverClassNames = '';
		for ( const key of hoverSettings ) {
			if ( dtCrHoverColor[ key ] ) {
				varsDefinition[ `--wp-block-button--hover-${ key }` ] = attributeToCss(
					dtCrHoverColor[ key ]
				);

				hoverClassNames += ` has-hover-${ key }`;
			}
		}

		return (
			<>
				<BlockListBlock
					{ ...props }
					wrapperProps={ extendWrapperPropsStyle( props?.wrapperProps, varsDefinition ) }
					className={ addCssClasses( props.className, hoverClassNames ) }
				/>
			</>
		);
	};
}, 'renderInEditor' );

addFilter(
	'blocks.registerBlockType',
	'dt-cr/button/hover-colors/modify-block-data',
	modifyBlockData
);

addFilter( 'editor.BlockEdit', 'dt-cr/button/hover-colors/edit-block', extendBlockEdit );

addFilter( 'editor.BlockListBlock', 'dt-cr/button/hover-colors/render-in-editor', renderInEditor );
