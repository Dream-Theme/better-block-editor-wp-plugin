import HidePositionStickyHelp from '@dt-cr/components/HidePositionStickyHelp';
import ToolPanelColorsList from '@dt-cr/components/ToolPanelColorsList';
import { useColorInputUtils, useGradientInputUtils } from '@dt-cr/hooks/use-color-input-utils';
import {
	blockEditorReady,
	getEditorContainerElement,
	getEditorDocument,
	getEditorIframe,
} from '@dt-cr/utils/editor-iframe-dom-utils';
import { extendWrapperPropsStyle, isBlockFullyEditable } from '@dt-cr/utils/utils';
import { InspectorControls } from '@wordpress/block-editor';
import {
	BaseControl,
	__experimentalItemGroup as ItemGroup,
	RangeControl,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useEffect, useRef } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import 'url-change-event';
import { ShadowPopover } from './dependencies/shadow-panel-components';
import './editor.scss';
import { createSentinelObserver, createTopSentinel } from './sentinel';

// Global sticky observer
let stickyObserver = null;

// Global scroll state
let isScrolled = false;

// this "registry" is used later in renderInEditor to add is-pinned class during rerender
// it stores clientId of pinned blocks
const pinnedBlockRegistry = new Map();

// for not iframed mode we need to take admin bar height into account
let topMenuHeight = 0;

// we need this reinitialization to handle switch between templates
// ( Appearence->Editor->Templates ) as there is no page reload during this process
window.addEventListener( 'urlchangeevent', () => {
	// RESET STATE
	topMenuHeight = 0;

	// reset isSrolled state
	isScrolled = false;

	// stop observing for sticky
	stickyObserver?.disconnect();

	// clear registry
	pinnedBlockRegistry.clear();

	blockEditorReady( () => {
		// reset tom menu height
		topMenuHeight = getTopMenuHeight();
		initPinReadyHandler();
	} );
} );

// after resize height of admin bar can change, implement throttled update
let resizeHandlerTimeout = null;
window.addEventListener( 'resize', () => {
	clearTimeout( resizeHandlerTimeout );
	resizeHandlerTimeout = setTimeout( ( topMenuHeight = getTopMenuHeight() ), 50 );
} );

// initialize on page load
blockEditorReady( () => {
	topMenuHeight = getTopMenuHeight();
	initPinReadyHandler();
} );

function getTopMenuHeight() {
	return getEditorIframe() ? 0 : getEditorContainerElement()?.getBoundingClientRect()?.top ?? 0;
}

function updatePinnedClasses( searchContainer ) {
	pinnedBlockRegistry.forEach( ( shouldPin, clientId ) => {
		const el = searchContainer.querySelector( `[data-block="${ clientId }"]` );
		if ( shouldPin && isScrolled ) {
			el?.classList.add( 'is-pinned' );
		} else {
			el?.classList.remove( 'is-pinned' );
		}
	} );
}

function initPinReadyHandler() {
	const editorContainerElement = getEditorIframe()
		? getEditorDocument().body
		: getEditorContainerElement();

	// !!! ATTENTION !!! for iframed block editor we have to use iframe as IntersectionObserver root

	// to detect window scroll use sentinel + IntersectionObserver
	// create top sentinel dynamically (1x1 pixel) and append to body (very first element)
	const topSentinel = createTopSentinel();
	// Observe for top sentinel to detect scroll
	const scrollObserver = createSentinelObserver(
		getEditorIframe()?.contentWindow?.document ?? editorContainerElement,
		( entry ) => {
			isScrolled = ! entry.isIntersecting;
			updatePinnedClasses( editorContainerElement );
		}
	);
	editorContainerElement.prepend( topSentinel );
	scrollObserver.observe( topSentinel );

	stickyObserver = new IntersectionObserver(
		( entries ) => {
			entries.forEach( ( entry ) => {
				const clientId = entry.target.getAttribute( 'data-block' );
				const shouldPin = entry.target.getBoundingClientRect().top < topMenuHeight + 1;
				pinnedBlockRegistry.set( clientId, shouldPin );
			} );
			updatePinnedClasses( editorContainerElement );
		},
		{
			root: getEditorIframe()?.contentWindow?.document ?? editorContainerElement,
			rootMargin: '-1px 0px 0px 0px',
			threshold: [ 1 ],
		}
	);

	// add pin-ready elements to observer
	editorContainerElement.querySelectorAll( '.is-pin-ready' ).forEach( ( el ) => {
		stickyObserver.observe( el );
		// initially not pinned
		pinnedBlockRegistry.set( el.getAttribute( 'data-block' ), false );
	} );
}

function needToApplyChanges( props ) {
	return props.attributes?.style?.position?.type === 'sticky';
}

function modifyBlockData( settings ) {
	return {
		...settings,
		attributes: {
			...settings.attributes,
			dtCrPinnedStyling: {
				background: {
					color: { type: 'string' },
					gradient: { type: 'string' },
				},
				borderColor: { type: 'string' },
				shadow: { type: 'string' },
				backdropBlur: { type: 'string' },
			},
		},
	};
}

const extendBlockEdit = createHigherOrderComponent( ( BlockEdit ) => {
	return ( props ) => {
		const {
			setAttributes,
			isSelected,
			clientId,
			attributes,
			attributes: { dtCrPinnedStyling = {} },
		} = props;

		// this trick is used to as a workaround for
		// <ToolPanelColorsList /> => <ColorGradientSettingsDropdown /> => <ColorGradientControl/>
		// => (<ColorPalette onChange />  and <GradientPicker onChange />)
		// see @wordpress/block-editor/src/components/colors-gradients/control.js
		const backgroundRef = useRef( dtCrPinnedStyling.background ?? {} );

		useEffect( () => {
			// in some cases there is NO such element it block editor yet (copy, transform preview)
			const element = getEditorDocument().querySelector( `[data-block="${ clientId }"]` );
			// if sticky position was removed we need to remove our settings
			if ( ! needToApplyChanges( props ) && attributes?.dtCrPinnedStyling ) {
				if ( stickyObserver && element ) {
					stickyObserver.unobserve( element );
				}
				setAttributes( { dtCrPinnedStyling: undefined } );
				return;
			}
			// it's safe to add element to observer more than once
			if ( stickyObserver && element && attributes?.dtCrPinnedStyling ) {
				stickyObserver.observe( element );
			}
			// we do not remove element from observer here
			// as when block is removed it's not a problem and if block still exists
			// we initiate "unobserve" / "observe" during any changes which has no sense
			return () => {};
		}, [ attributes?.dtCrPinnedStyling, clientId, props, setAttributes ] );

		const updateDtCrPinnedStyling = ( value ) => {
			setAttributes( { dtCrPinnedStyling: { ...dtCrPinnedStyling, ...value } } );
		};

		const { attributeToInput: colorAttributeToInput, inputToAttribute: colorInputToAttribute } =
			useColorInputUtils();

		const {
			attributeToInput: gradientAttributeToInput,
			inputToAttribute: gradientInputToAttribute,
		} = useGradientInputUtils();

		const panelId = 'pinned-block-styling-' + clientId;

		if ( ! needToApplyChanges( props ) || ! isBlockFullyEditable( clientId ) ) {
			return <BlockEdit { ...props } />;
		}

		return (
			<>
				<BlockEdit { ...props } />

				{ isSelected && (
					<InspectorControls group="position">
						<HidePositionStickyHelp stickyBlockClientId={ clientId } />
						<BaseControl
							__nextHasNoMarginBottom
							className="dt-cr__pinned-block-styling-help"
							help={ __(
								'You can change some styles when the block becomes sticky on scroll in the "Styles" tab.',
								'dt-cr'
							) }
						/>
					</InspectorControls>
				) }
				{ isSelected && (
					<InspectorControls group="styles">
						<ToolsPanel
							panelId={ panelId }
							className="dt-cr pinned-block-styling"
							label={ __( 'Styles on Scroll', 'bbe' ) }
							resetAll={ () => setAttributes( { dtCrPinnedStyling: undefined } ) }
							__experimentalFirstVisibleItemClass="first"
							__experimentalLastVisibleItemClass="last"
						>
							<ToolsPanelItem
								isShownByDefault
								panelId={ panelId }
								hasValue={ () => !! dtCrPinnedStyling?.shadow }
								label={ __( 'Shadow', 'bbe' ) }
								onDeselect={ () => {
									setAttributes(
										updateDtCrPinnedStyling( { shadow: undefined } )
									);
								} }
							>
								<BaseControl.VisualLabel as="legend">
									{ __( 'Shadow', 'bbe' ) }
								</BaseControl.VisualLabel>

								<ItemGroup isBordered isSeparated>
									<ShadowPopover
										shadow={ dtCrPinnedStyling.shadow ?? 'none' }
										onShadowChange={ ( value ) => {
											updateDtCrPinnedStyling( {
												shadow: value === 'none' ? undefined : value,
											} );
										} }
										// this variable is set in Module.php
										// eslint-disable-next-line no-undef
										settings={ DT_CR_SHADOW_PRESETS }
									/>
								</ItemGroup>
							</ToolsPanelItem>

							<ToolsPanelItem
								isShownByDefault
								panelId={ panelId }
								hasValue={ () =>
									( dtCrPinnedStyling.backdropBlur ?? '0px' ) !== '0px'
								}
								label={ __( 'Backdrop blur', 'bbe' ) }
								onDeselect={ () => {
									setAttributes(
										updateDtCrPinnedStyling( { backdropBlur: undefined } )
									);
								} }
							>
								<RangeControl
									__nextHasNoMarginBottom
									__next40pxDefaultSize
									max={ 10 }
									min={ 0 }
									step={ 1 }
									value={
										dtCrPinnedStyling.backdropBlur
											? parseInt( dtCrPinnedStyling.backdropBlur, 10 )
											: 0
									}
									label={ __( 'Backdrop blur', 'bbe' ) }
									onChange={ ( value ) =>
										updateDtCrPinnedStyling( {
											backdropBlur: value !== 0 ? value + 'px' : undefined,
										} )
									}
									renderTooltipContent={ ( value ) => `${ value }px` }
								/>
							</ToolsPanelItem>

							<ToolPanelColorsList
								label={ __( 'Colors', 'bbe' ) }
								panelId={ panelId }
								__experimentalIsRenderedInSidebar
								settings={ [
									{
										label: __( 'Background', 'bbe' ),
										enableAlpha: true,
										clearable: true,
										colorValue: colorAttributeToInput(
											dtCrPinnedStyling.background?.color
										),
										onColorChange: ( value ) => {
											backgroundRef.current = {
												...backgroundRef.current,
												color: colorInputToAttribute( value ),
											};
											updateDtCrPinnedStyling( {
												background: backgroundRef.current,
											} );
										},

										gradientValue: gradientAttributeToInput(
											dtCrPinnedStyling.background?.gradient
										),
										onGradientChange: ( value ) => {
											backgroundRef.current = {
												...backgroundRef.current,
												gradient: gradientInputToAttribute( value ),
											};
											updateDtCrPinnedStyling( {
												background: backgroundRef.current,
											} );
										},
									},
									{
										label: __( 'Border color', 'bbe' ),
										enableAlpha: true,
										clearable: true,

										colorValue: colorAttributeToInput(
											dtCrPinnedStyling.borderColor
										),
										onColorChange: ( value ) =>
											updateDtCrPinnedStyling( {
												borderColor: colorInputToAttribute( value ),
											} ),
									},
								] }
							/>
						</ToolsPanel>
					</InspectorControls>
				) }
			</>
		);
	};
}, 'extendBlockEdit' );

const renderInEditor = createHigherOrderComponent(
	( BlockListBlock ) => ( props ) => {
		const { attributeToCss: colorAttributeToCss } = useColorInputUtils();
		const { attributeToCss: gradientAttributeToCss } = useGradientInputUtils();

		if ( ! needToApplyChanges( props ) ) {
			return <BlockListBlock { ...props } />;
		}

		const { dtCrPinnedStyling = {} } = props.attributes;

		const { background, borderColor, backdropBlur, shadow } = dtCrPinnedStyling;

		let backgroundValue;
		if ( background?.color ) {
			backgroundValue = colorAttributeToCss( background.color );
		} else if ( background?.gradient ) {
			backgroundValue = gradientAttributeToCss( background.gradient );
		}

		const cssVars = {
			'--wp-sticky--pinned-background': backgroundValue,
			'--wp-sticky--pinned-border-color': colorAttributeToCss( borderColor ),
			'--wp-sticky--pinned-backdrop-blur': backdropBlur,
			'--wp-sticky--pinned-shadow': shadow,
		};
		// don't add empty variables
		for ( const varName of Object.getOwnPropertyNames( cssVars ) ) {
			if ( ! cssVars[ varName ] ) {
				delete cssVars[ varName ];
			}
		}

		// provide additional css classes for non empty settings
		const cssClasses = {
			'has-pinned-background': backgroundValue,
			'has-pinned-border': borderColor,
			'has-pinned-blur': backdropBlur,
			'has-pinned-shadow': shadow,
		};

		return (
			<BlockListBlock
				{ ...props }
				className={ clsx( props.className, 'is-pin-ready ', cssClasses, {
					'is-pinned': pinnedBlockRegistry.get( props.clientId ) && isScrolled,
				} ) }
				wrapperProps={ extendWrapperPropsStyle( props.wrapperProps, cssVars ) }
			/>
		);
	},
	'renderInEditor'
);

addFilter(
	'blocks.registerBlockType',
	'dt-cr/__all__/pinned-block-styling/modify-block-data',
	modifyBlockData
);

addFilter(
	'editor.BlockEdit',
	'dt-cr/__all__/pinned-block-styling/edit-block',
	extendBlockEdit,
	500
);

addFilter(
	'editor.BlockListBlock',
	'dt-cr/__all__/pinned-block-styling/render-in-editor',
	renderInEditor
);
