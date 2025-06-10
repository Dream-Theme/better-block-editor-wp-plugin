import { addCssClasses } from '@dt-cr/css-classes-utils';
import { getEditorDocument } from '@dt-cr/utils/editor-iframe-dom-utils';
import { isBlockFullyEditable } from '@dt-cr/utils/utils';
import {
	BlockControls,
	InspectorControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import {
	BaseControl,
	CustomSelectControl,
	__experimentalNumberControl as NumberControl,
	PanelBody,
} from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import { select } from '@wordpress/data';
import { useEffect, useRef } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import { ANIMATION_CLASSNAME, THROTTLED_UPDATE_TIMEOUT } from './constants';
import './editor.scss';

const UNSUPPORTED_BLOCK_TYPES = [ 'core/template-part' ];

const findSelectedBlockToolbar = () => {
	const clientId = select( blockEditorStore ).getSelectedBlockClientId();
	const toolbarSelector =
		'.block-editor-block-list__block-popover:has(.block-editor-block-toolbar)' +
		`:has([data-dt-cr-clientid="${ clientId }"])`;
	return document.querySelector( toolbarSelector );
};

const findSelectedBlockResizeHandles = () => {
	const clientId = select( blockEditorStore ).getSelectedBlockClientId();
	const block = select( blockEditorStore ).getBlock( clientId );

	if ( block.name === 'core/cover' ) {
		const resizeHandleSelector =
			'.block-editor-block-list__block-popover:has(.block-editor-block-toolbar)' +
			`:has([data-dt-cr-clientid="${ clientId }"]) ~ .popover-slot .block-editor-block-popover .components-resizable-box__handle`;
		// in DOM this resize handle is just after the block toolbar (main document)
		return [ document.querySelector( resizeHandleSelector ) ];
	}

	if ( block.name === 'core/image' ) {
		const resizeHandleSelector = `#block-${ clientId } .components-resizable-box__container.has-show-handle :has(>.components-resizable-box__side-handle)`;
		return Array.from( getEditorDocument().querySelectorAll( resizeHandleSelector ) );
	}
};

const hideBlockToolbar = () => {
	const toolbarElement = findSelectedBlockToolbar();
	if ( toolbarElement ) {
		toolbarElement.classList.add( 'dt-cr-block-toolbar-hidden' );
	}

	const resizeHandleElements = findSelectedBlockResizeHandles();

	if ( resizeHandleElements ) {
		resizeHandleElements.forEach( ( el ) => {
			el.classList.add( 'dt-cr-block-toolbar-hidden' );
		} );
	}
};

const showBlockToolbar = () => {
	const toolbarElement = findSelectedBlockToolbar();
	if ( toolbarElement ) {
		toolbarElement.classList.remove( 'dt-cr-block-toolbar-hidden' );
	}

	const resizeHandleElements = findSelectedBlockResizeHandles();
	if ( resizeHandleElements ) {
		resizeHandleElements.forEach( ( el ) =>
			el.classList.remove( 'dt-cr-block-toolbar-hidden' )
		);
	}
};

function attachAnimationListeners( blockElement ) {
	blockElement.addEventListener( 'animationstart', hideBlockToolbar );
	blockElement.addEventListener( 'animationiteration', hideBlockToolbar );
	blockElement.addEventListener( 'animationcancel', showBlockToolbar );
	blockElement.addEventListener( 'animationend', showBlockToolbar );
}

function detachAnimationListeners( blockElement ) {
	blockElement.removeEventListener( 'animationstart', hideBlockToolbar );
	blockElement.removeEventListener( 'animationiteration', hideBlockToolbar );
	blockElement.removeEventListener( 'animationcancel', showBlockToolbar );
	blockElement.removeEventListener( 'animationend', showBlockToolbar );
}

function modifyBlockData( settings ) {
	return {
		...settings,
		attributes: {
			...settings.attributes,
			dtCrAnimationOnScroll: {
				animation: {
					type: 'string',
				},
				timingFunction: {
					type: 'string',
				},
				duration: {
					type: 'number',
				},
				delay: {
					type: 'number',
				},
			},
		},
	};
}

const extendBlockEdit = createHigherOrderComponent( ( BlockEdit ) => {
	return ( props ) => {
		const { name: blockName, setAttributes, isSelected, clientId } = props;

		// default animation settings
		const dtCrAnimationOnScroll = props.attributes?.dtCrAnimationOnScroll || {
			animation: null,
			timingFunction: 'linear',
			duration: 300,
			delay: 0,
		};

		const animationOptions = [
			{ name: __( 'Off', 'bbe' ), key: null },
			{ name: __( 'Fade in', 'bbe' ), key: 'fade-in' },
			{ name: __( 'Slide up', 'bbe' ), key: 'slide-up' },
			{ name: __( 'Slide down', 'bbe' ), key: 'slide-down' },
			{ name: __( 'Slide left', 'bbe' ), key: 'slide-left' },
			{ name: __( 'Slide right', 'bbe' ), key: 'slide-right' },
			{ name: __( 'Zoom in', 'bbe' ), key: 'zoom-in' },
			{ name: __( 'Zoom out', 'bbe' ), key: 'zoom-out' },
		];

		const timingFunctionOptions = [
			{ name: __( 'Linear', 'bbe' ), key: 'linear' },

			{ name: __( 'Ease', 'bbe' ), key: 'ease' },
			{ name: __( 'Ease in', 'bbe' ), key: 'ease-in' },
			{ name: __( 'Ease out', 'bbe' ), key: 'ease-out' },
			{ name: __( 'Ease in out', 'bbe' ), key: 'ease-in-out' },

			{ name: __( 'Ease back', 'bbe' ), key: 'ease-back' },

			{ name: __( 'Ease in quad', 'bbe' ), key: 'ease-in-quad' },
			{ name: __( 'Ease out quad', 'bbe' ), key: 'ease-out-quad' },
			{ name: __( 'Ease in out quad', 'bbe' ), key: 'ease-in-out-quad' },

			{ name: __( 'Ease in quart', 'bbe' ), key: 'ease-in-quart' },
			{ name: __( 'Ease out quart', 'bbe' ), key: 'ease-out-quart' },
			{ name: __( 'Ease in out quart', 'bbe' ), key: 'ease-in-out-quart' },

			{ name: __( 'Ease in expo', 'bbe' ), key: 'ease-in-expo' },
			{ name: __( 'Ease out expo', 'bbe' ), key: 'ease-out-expo' },
			{ name: __( 'Ease in out expo', 'bbe' ), key: 'ease-in-out-expo' },
		];

		let timeout;
		const throttledUpdateData = useRef( {} );

		if (
			! isSelected ||
			! isBlockFullyEditable( clientId ) ||
			UNSUPPORTED_BLOCK_TYPES.includes( blockName )
		) {
			return <BlockEdit { ...props } />;
		}

		const throttledUpdate = ( value ) => {
			throttledUpdateData.current = { ...throttledUpdateData.current, ...value };
			if ( timeout ) {
				clearTimeout( timeout );
			}

			timeout = setTimeout( () => {
				const newSettings = { ...dtCrAnimationOnScroll, ...throttledUpdateData.current };
				throttledUpdateData.current = {};
				updateAnimationSettings( newSettings );
			}, THROTTLED_UPDATE_TIMEOUT );
		};

		const updateAnimationSettings = ( value ) => {
			// if animation is OFF just remove all settings
			if ( value.animation === null ) {
				setAttributes( { dtCrAnimationOnScroll: undefined } );
				return;
			}

			const blockElement = getEditorDocument().querySelector( `#block-${ clientId }` );

			blockElement.classList.remove( ANIMATION_CLASSNAME );

			const interval = setInterval( () => {
				// wait until changes from above (remove animate class) are applied
				if ( blockElement && ! blockElement.classList.contains( ANIMATION_CLASSNAME ) ) {
					clearInterval( interval );
					blockElement.classList.add( ANIMATION_CLASSNAME );
					setAttributes( {
						dtCrAnimationOnScroll: { ...dtCrAnimationOnScroll, ...value },
					} );
				}
			}, 10 );
		};

		return (
			<>
				<BlockEdit { ...props } />

				<BlockControls>
					<div data-dt-cr-clientid={ clientId } style={ { display: 'none' } }></div>
				</BlockControls>

				{ isSelected && (
					<InspectorControls>
						<PanelBody
							title={ __( 'Animation on Scroll', 'bbe' ) }
							initialOpen={ dtCrAnimationOnScroll.animation !== null }
							className="dt-cr animation-on-scroll"
						>
							<BaseControl __nextHasNoMarginBottom>
								<CustomSelectControl
									label={ __( 'Animation', 'bbe' ) }
									value={ animationOptions.find(
										( option ) => option.key === dtCrAnimationOnScroll.animation
									) }
									options={ animationOptions }
									onChange={ ( selection ) =>
										updateAnimationSettings( {
											animation: selection.selectedItem.key,
										} )
									}
									size="__unstable-large"
								/>
							</BaseControl>

							{ null !== dtCrAnimationOnScroll.animation && (
								<>
									<BaseControl
										help={ __( 'Select animation timing function.', 'bbe' ) }
										__nextHasNoMarginBottom
									>
										<CustomSelectControl
											label={ __( 'Easing', 'bbe' ) }
											value={ timingFunctionOptions.find(
												( option ) =>
													option.key ===
													dtCrAnimationOnScroll.timingFunction
											) }
											options={ timingFunctionOptions }
											onChange={ ( selection ) =>
												updateAnimationSettings( {
													timingFunction: selection.selectedItem.key,
												} )
											}
											size="__unstable-large"
										/>
									</BaseControl>
									<NumberControl
										__next40pxDefaultSize
										label={ __( 'Animation duration', 'bbe' ) }
										isShiftStepEnabled={ true }
										onChange={ ( value ) =>
											throttledUpdate( { duration: value } )
										}
										min={ 0 }
										shiftStep={ 100 }
										value={ dtCrAnimationOnScroll.duration }
										help={ __( 'In milliseconds (ms).', 'bbe' ) }
									/>

									<NumberControl
										__next40pxDefaultSize
										label={ __( 'Animation delay', 'bbe' ) }
										isShiftStepEnabled={ true }
										onChange={ ( value ) =>
											throttledUpdate( { delay: value } )
										}
										min={ 0 }
										shiftStep={ 100 }
										value={ dtCrAnimationOnScroll.delay }
										help={ __( 'In milliseconds (ms).', 'bbe' ) }
									/>
								</>
							) }
						</PanelBody>
					</InspectorControls>
				) }
			</>
		);
	};
}, 'extendBlockEdit' );

const renderInEditor = createHigherOrderComponent(
	( BlockListBlock ) => ( props ) => {
		const {
			wrapperProps = {},
			attributes: { dtCrAnimationOnScroll = {} },
			clientId,
			isSelected,
		} = props;

		// if block is selected we don't show BlockToolbar during animation
		useEffect( () => {
			const blockElement = getEditorDocument().querySelector( `#block-${ clientId }` );
			// block always has to be present on this stage, but just in case ...
			if ( ! blockElement ) {
				return;
			}

			if ( isSelected ) {
				attachAnimationListeners( blockElement );
			} else {
				detachAnimationListeners( blockElement );
			}
		}, [ clientId, isSelected ] );

		// apply modifications only to the block that needs it
		if ( null === ( dtCrAnimationOnScroll.animation ?? null ) ) {
			return <BlockListBlock { ...props } />;
		}

		const animationSettings = { style: wrapperProps?.style ?? {} };

		animationSettings[ 'data-aos' ] = dtCrAnimationOnScroll.animation;

		animationSettings[ 'data-aos-easing' ] = dtCrAnimationOnScroll.timingFunction ?? '';

		animationSettings.style[ '--aos-duration' ] =
			Number( dtCrAnimationOnScroll.duration ?? 0 ) / 1000 + 's';

		animationSettings.style[ '--aos-delay' ] =
			Number( dtCrAnimationOnScroll.delay ?? 0 ) / 1000 + 's';

		return (
			<BlockListBlock
				{ ...props }
				wrapperProps={ { ...wrapperProps, ...animationSettings } }
				className={ addCssClasses( props.className, ANIMATION_CLASSNAME ) }
			/>
		);
	},
	'renderInEditor'
);

addFilter(
	'blocks.registerBlockType',
	'dt-cr/__all__/animation-on-scroll/modify-block-data',
	modifyBlockData
);

addFilter(
	'editor.BlockEdit',
	'dt-cr/__all__/animation-on-scroll/edit-block',
	extendBlockEdit,
	500
);

addFilter(
	'editor.BlockListBlock',
	'dt-cr/__all__/animation-on-scroll/render-in-editor',
	renderInEditor
);
