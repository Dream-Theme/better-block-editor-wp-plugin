import { BLOCK_PREFIX } from '@dt-cr/constants';
import { addCssClasses } from '@dt-cr/css-classes-utils';
import { DtCrRefAnchor } from '@dt-cr/editor-css-store/components/DtCrRefAnchor';
import { getSwitchWidth } from '@dt-cr/responsive';
import { isBlockFullyEditable } from '@dt-cr/utils/utils';
import { InspectorControls } from '@wordpress/block-editor';
import { PanelBody } from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useEffect, useMemo, useState } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import { useAddEditorStyle } from 'dt-cr/editor-css-store';
import { FEATURE_NAME } from './constants';
import './editor.scss';
import VisibilitySettings from './visibility-settings';

const UNSUPPORTED_BLOCK_TYPES = [ 'core/template-part' ];

function modifyBlockData( settings ) {
	return {
		...settings,
		attributes: {
			...settings.attributes,
			dtCrVisibility: {
				visibility: {
					type: 'string',
				},
				breakpoint: {
					type: 'string',
				},
				breakpointCustomValue: {
					type: 'string',
				},
			},
		},
	};
}

const VISIBILITY_BEFORE_CSS = `
	content: "";
	display: block;
	position: absolute;
	top: 0;
	left: 0;
	background: repeating-linear-gradient(
		-45deg,
		rgb(255 255 255 / 30%),
		rgb(255 255 255 / 30%) 3px,
		rgb(120 120 120 / 30%) 3px,
		rgb(120 120 120 / 30%) 6px
	) !important;
	z-index: 1000;
	width: 100%;
	height: 100%;
	box-sizing: border-box;
	clip-path: none;`;

function getInlineCSS( attributes, clientId ) {
	if ( ! attributes?.dtCrVisibility ?? false ) {
		return null;
	}
	const { visibility, breakpoint, breakpointCustomValue } = attributes.dtCrVisibility || {};

	const switchWidth = getSwitchWidth( breakpoint, breakpointCustomValue );

	const cssBlockId = BLOCK_PREFIX + `${ clientId }`;

	const css = [];
	let mediaRule = '';
	let visibilityClass = '';

	if ( breakpoint && switchWidth ) {
		if ( visibility === 'hidden' ) {
			// for hidden
			mediaRule = 'width > ';
			visibilityClass = 'hidden';
			css.push( `@media screen and (width <= ${ switchWidth }) {
					body:not(.dt-cr-visibility-helper) .dt-cr-visibility-hidden.${ cssBlockId } { 
						display: flex !important; 
					}
				}` );
		} else {
			// if visible
			mediaRule = 'width <= ';
			visibilityClass = 'visible';
			css.push( `@media screen and (width <= ${ switchWidth }) {
				body:not(.dt-cr-visibility-helper) .dt-cr-visibility-visible.${ cssBlockId } { 
					display: none !important; 
				}
			}` );
		}
		// body.dt-cr-visibility-helper .dt-cr-visibility-hidden.${ cssBlockId }{ display: flex !important; }
		css.push( `@media screen and (${ mediaRule } ${ switchWidth }) {
			body.dt-cr-visibility-helper .dt-cr-visibility-${ visibilityClass }.${ cssBlockId } {  opacity: 0.6; }
			body.dt-cr-visibility-helper .dt-cr-visibility-${ visibilityClass }.${ cssBlockId }:before { ${ VISIBILITY_BEFORE_CSS } }
		}` );
	}

	// show "hidden" overlay for hidden with no breakpoint (always hidden on frontend)
	if ( visibility === 'hidden' && ! breakpoint ) {
		css.push(
			`body.dt-cr-visibility-helper .dt-cr-visibility-hidden.${ cssBlockId } { opacity: 0.6; }`
		);
		css.push(
			`body.dt-cr-visibility-helper .dt-cr-visibility-hidden.${ cssBlockId }:before { ${ VISIBILITY_BEFORE_CSS }}`
		);
	}

	return css;
}

const extendBlockEdit = createHigherOrderComponent( ( BlockEdit ) => {
	return ( props ) => {
		const { attributes, name: blockName, clientId, isSelected } = props;
		const [ initialOpen, setInitialOpen ] = useState();

		const { breakpoint, visibility } = attributes?.dtCrVisibility ?? {};

		useEffect( () => {
			// If any selected block has a position set, open the panel by default.
			// The first block's value will still be used within the control though.
			// if (initialOpen === undefined) {
			let isOpen = false;
			if ( attributes?.dtCrVisibility ) {
				isOpen = visibility === 'hidden' || breakpoint;
			}
			setInitialOpen( isOpen );
			//}
		}, [ initialOpen, visibility, breakpoint, setInitialOpen, attributes?.dtCrVisibility ] );

		const inlineCSS = useMemo(
			() => getInlineCSS( attributes, clientId ),
			[ attributes, clientId ]
		);

		const ref = useAddEditorStyle( inlineCSS, FEATURE_NAME + '__' + clientId );

		if (
			! isSelected ||
			! isBlockFullyEditable( clientId ) ||
			UNSUPPORTED_BLOCK_TYPES.includes( blockName )
		) {
			// we need DtCrRef anchor here as well coz we add styling to mark hidden block
			// even to blocks which are not selected
			return (
				<>
					<DtCrRefAnchor ref={ ref } />
					<BlockEdit { ...props } />
				</>
			);
		}
		return (
			<>
				<DtCrRefAnchor ref={ ref } />

				<BlockEdit { ...props } />

				{ isSelected && (
					<InspectorControls>
						<PanelBody
							title={ __( 'Visibility', 'bbe' ) }
							initialOpen={ initialOpen ?? false }
							className="dt-cr responsive-visibility"
						>
							<VisibilitySettings props={ props } />
						</PanelBody>
					</InspectorControls>
				) }
			</>
		);
	};
}, 'extendBlockEdit' );

function getClasses( cssClasses, attributes, clientId ) {
	const { visibility, breakpoint } = attributes?.dtCrVisibility ?? {};

	cssClasses = addCssClasses( cssClasses, BLOCK_PREFIX + `${ clientId }` );

	// dt-cr-visibility-breakpoint-* class has no effect on frontend
	// and used only to indicate that there is a breakpoint
	if ( breakpoint || visibility ) {
		cssClasses = addCssClasses(
			cssClasses,
			`dt-cr-visibility-${ visibility || 'visible' }` +
				( breakpoint ? ` dt-cr-visibility-breakpoint-${ breakpoint }` : '' )
		);
	}

	return cssClasses;
}

const renderInEditor = createHigherOrderComponent(
	( BlockListBlock ) => ( props ) => {
		if ( ! props.attributes.dtCrVisibility ?? false ) {
			return <BlockListBlock { ...props } />;
		}

		return (
			<BlockListBlock
				{ ...props }
				className={ getClasses( props.className, props.attributes, props.clientId ) }
			/>
		);
	},
	'renderInEditor'
);

addFilter(
	'blocks.registerBlockType',
	'dt-cr/__all__/visibility/modify-block-data',
	modifyBlockData
);

addFilter( 'editor.BlockEdit', 'dt-cr/__all__/visibility/edit-block', extendBlockEdit, 500 );

addFilter( 'editor.BlockListBlock', 'dt-cr/__all__/visibility/render-in-editor', renderInEditor );
