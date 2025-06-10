import ResponsiveBreakpointControl, {
	BREAKPOINT_OPTION_CUSTOM,
	BREAKPOINT_OPTION_OFF,
} from '@dt-cr/components/responsive-breakpoint-control';
import ResponsiveBreakpointCustomValue from '@dt-cr/components/responsive-breakpoint-custom-value';
import { BLOCK_PREFIX } from '@dt-cr/constants';
import { addCssClasses } from '@dt-cr/css-classes-utils';
import { DtCrRefAnchor } from '@dt-cr/editor-css-store/components/DtCrRefAnchor';
import { useHandleDeletedUserBreakpoint } from '@dt-cr/hooks/useHandleDeletedUserBreakpoint';
import { getSwitchWidth } from '@dt-cr/responsive';
import { InspectorControls, useBlockEditingMode, useHasRecursion } from '@wordpress/block-editor';
import {
	Button,
	Notice,
	PanelBody,
	ToggleControl,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import { createHigherOrderComponent, useInstanceId } from '@wordpress/compose';
import { useMemo, useState } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import { close, Icon } from '@wordpress/icons';
import classnames from 'classnames';
import { useAddEditorStyle } from 'dt-cr/editor-css-store';
import { FEATURE_NAME } from './constants';
import OverlayMenuIcon from './dependencies/overlay-menu-icon';
import OverlayMenuPreview from './dependencies/overlay-menu-preview';
import useConvertClassicToBlockMenu, {
	CLASSIC_MENU_CONVERSION_PENDING,
} from './dependencies/use-convert-classic-menu-to-block-menu';
import useCreateNavigationMenu from './dependencies/use-create-navigation-menu';
import { useInnerBlocks } from './dependencies/use-inner-blocks';
import useNavigationEntities from './dependencies/use-navigation-entities';
import useNavigationMenu from './dependencies/use-navigation-menu';
import './editor.scss';

const BLOCK_NAME = 'core/navigation';

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
			dtCrOverlayMenu: {
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

function getInlineCSS( attributes, clientId ) {
	// if we can not determine switch width we always show menu expanded (no overlay icon)
	const switchWidth =
		getSwitchWidth(
			attributes.dtCrOverlayMenu?.breakpoint,
			attributes.dtCrOverlayMenu?.breakpointCustomValue
		) ?? '0px';

	// see https://github.com/WordPress/WordPress/blob/6.4.3/wp-includes/css/dist/block-library/editor.css
	// for changes applied to editor only and
	const dtCrSelector = BLOCK_PREFIX + clientId;
	const navSelector = `.wp-block-navigation.${ dtCrSelector }`;
	const navOpenerSelector = `${ navSelector } .wp-block-navigation__responsive-container-open:not(.always-shown)`;
	const navContentSelector = `${ navSelector } .wp-block-navigation__responsive-container:not(.is-menu-open)`;

	return `
	@media screen and (width > ${ switchWidth }) {
		${ navOpenerSelector } {
			display: none;	
		}
		
		${ navContentSelector }:not(.hidden-by-default) {
			display : block; 
			position: relative;
			width: 100%;
			z-index: auto
		}
		
		${ navContentSelector } .components-button.wp-block-navigation__responsive-container-close {
			display: none; 
		}

		${ navSelector } .wp-block-navigation__responsive-container.is-menu-open .wp-block-navigation__submenu-container.wp-block-navigation__submenu-container.wp-block-navigation__submenu-container.wp-block-navigation__submenu-container {
			left: 0;
		}
	}`;
}
/**
 * This code is copied from original guttenberg implementation and modified to remove
 * unnecessary logic. Structure and variables are the same (only Inline CSS implementation was added).
 * @see https://github.com/WordPress/gutenberg/blob/v16.7.1/packages/block-library/src/navigation/edit/index.js
 * @param {Object} BlockEdit
 */
const extendBlockEdit = createHigherOrderComponent( ( BlockEdit ) => {
	return ( props ) => {
		if ( ! needToApplyChanges( props ) ) {
			return <BlockEdit { ...props } />;
		}

		const {
			attributes,
			setAttributes,
			clientId,
			hasSubmenuIndicatorSetting = true,
			customPlaceholder: CustomPlaceholder = null,
		} = props;

		const {
			overlayMenu,
			dtCrOverlayMenu = {},
			openSubmenusOnClick,
			showSubmenuIcon,
			hasIcon,
			icon = 'handle',
		} = attributes;

		const { breakpoint, breakpointCustomValue } = dtCrOverlayMenu;

		// if breakpoint was deactivated by user, reset to custom one with the same breakpoint value
		useHandleDeletedUserBreakpoint( breakpoint, ( newValue ) => {
			setAttributes( {
				dtCrOverlayMenu: {
					...dtCrOverlayMenu,
					breakpoint: BREAKPOINT_OPTION_CUSTOM,
					breakpointCustomValue: newValue,
				},
			} );
		} );

		const ref = attributes.ref;

		const recursionId = `navigationMenu/${ ref }`;
		const hasAlreadyRendered = useHasRecursion( recursionId );

		const blockEditingMode = useBlockEditingMode();

		const { menus: classicMenus } = useNavigationEntities();

		const { create: createNavigationMenu, isPending: isCreatingNavigationMenu } =
			useCreateNavigationMenu( clientId );

		const { hasUncontrolledInnerBlocks, innerBlocks } = useInnerBlocks( clientId );

		const hasSubmenus = !! innerBlocks.find(
			( block ) => block.name === 'core/navigation-submenu'
		);

		const [ overlayMenuPreview, setOverlayMenuPreview ] = useState( false );

		const { hasResolvedNavigationMenus, isNavigationMenuResolved, isNavigationMenuMissing } =
			useNavigationMenu( ref );

		const { status: classicMenuConversionStatus } =
			useConvertClassicToBlockMenu( createNavigationMenu );

		const isConvertingClassicMenu =
			classicMenuConversionStatus === CLASSIC_MENU_CONVERSION_PENDING;

		const isEntityAvailable = ! isNavigationMenuMissing && isNavigationMenuResolved;

		const hasUnsavedBlocks = hasUncontrolledInnerBlocks && ! isEntityAvailable;

		const isPlaceholder =
			! ref &&
			! isCreatingNavigationMenu &&
			! isConvertingClassicMenu &&
			hasResolvedNavigationMenus &&
			classicMenus?.length === 0 &&
			! hasUncontrolledInnerBlocks;

		const isResponsive = 'never' !== overlayMenu;

		const overlayMenuPreviewClasses = classnames( 'wp-block-navigation__overlay-menu-preview', {
			open: overlayMenuPreview,
		} );

		const submenuAccessibilityNotice =
			! showSubmenuIcon && ! openSubmenusOnClick
				? __(
						'The current menu options offer reduced accessibility for users and are not recommended. Enabling either "Open on Click" or "Show arrow" offers enhanced accessibility by allowing keyboard users to browse submenus selectively.'
				  )
				: '';
		const overlayMenuPreviewId = useInstanceId( OverlayMenuPreview, `overlay-menu-preview` );

		const stylingInspectorControls = (
			<InspectorControls>
				{ hasSubmenuIndicatorSetting && (
					<PanelBody
						title={ __( 'Display' ) }
						className="dt-cr navigation-display-with-responsiveness"
					>
						{ isResponsive && (
							<>
								<Button
									className={ overlayMenuPreviewClasses }
									onClick={ () => {
										setOverlayMenuPreview( ! overlayMenuPreview );
									} }
									aria-label={ __( 'Overlay menu controls' ) }
									aria-controls={ overlayMenuPreviewId }
									aria-expanded={ overlayMenuPreview }
								>
									{ hasIcon && (
										<>
											<OverlayMenuIcon icon={ icon } />
											<Icon icon={ close } />
										</>
									) }
									{ ! hasIcon && (
										<>
											<span>{ __( 'Menu' ) }</span>
											<span>{ __( 'Close' ) }</span>
										</>
									) }
								</Button>
								<div id={ overlayMenuPreviewId }>
									{ overlayMenuPreview && (
										<OverlayMenuPreview
											setAttributes={ setAttributes }
											hasIcon={ hasIcon }
											icon={ icon }
											hidden={ ! overlayMenuPreview }
										/>
									) }
								</div>
							</>
						) }
						<h3>{ __( 'Overlay Menu' ) }</h3>
						<ToggleGroupControl
							__nextHasNoMarginBottom
							label={ __( 'Configure overlay menu' ) }
							value={ overlayMenu }
							help={ __(
								'Collapses the navigation options in a menu icon opening an overlay.'
							) }
							onChange={ ( value ) => {
								// CHANGE: reset breakpoint settings if not "mobile" chosen
								// in case we switched to responsiveness ("mobile")
								// set breakpoint to 'tablet' as it's not set automatically
								// see <ResponsiveBreakpointControl> implementation
								const attr = { overlayMenu: value };
								if ( value !== 'mobile' ) {
									attr.dtCrOverlayMenu = {
										breakpoint: undefined,
										breakpointCustomValue: undefined,
									};
								}
								setAttributes( attr );
							} }
							isBlock
							hideLabelFromVision
						>
							<ToggleGroupControlOption value="never" label={ __( 'Off' ) } />
							<ToggleGroupControlOption
								value="mobile"
								label={ __( 'Responsive', 'bbe' ) }
							/>
							<ToggleGroupControlOption value="always" label={ __( 'Always' ) } />
						</ToggleGroupControl>

						{ /* We don't rename original breakpoint just treat it as "responsive" */ }
						{ overlayMenu === 'mobile' && (
							<>
								<ResponsiveBreakpointControl
									label={ __( 'Breakpoint', 'bbe' ) }
									value={ breakpoint }
									unsupportedValues={ [ BREAKPOINT_OPTION_OFF ] }
									onChange={ ( value ) => {
										setAttributes( {
											dtCrOverlayMenu: {
												breakpoint: value,
												breakpointCustomValue:
													value === BREAKPOINT_OPTION_CUSTOM
														? breakpointCustomValue
														: undefined,
											},
										} );
									} }
									help={
										breakpoint !== BREAKPOINT_OPTION_CUSTOM
											? __(
													'Collapse navigation at this breakpoint and below.',
													'bbe'
											  )
											: null
									}
								/>

								{ breakpoint === BREAKPOINT_OPTION_CUSTOM && (
									<ResponsiveBreakpointCustomValue
										value={ breakpointCustomValue }
										onChange={ ( value ) => {
											setAttributes( {
												dtCrOverlayMenu: {
													breakpoint: BREAKPOINT_OPTION_CUSTOM,
													breakpointCustomValue: value,
												},
											} );
										} }
										help={ __(
											'Collapse navigation at this breakpoint and below.',
											'bbe'
										) }
									/>
								) }
							</>
						) }

						{ hasSubmenus && (
							<>
								<h3>{ __( 'Submenus' ) }</h3>
								<ToggleControl
									__nextHasNoMarginBottom
									checked={ openSubmenusOnClick }
									onChange={ ( value ) => {
										setAttributes( {
											openSubmenusOnClick: value,
											...( value && {
												showSubmenuIcon: true,
											} ), // Make sure arrows are shown when we toggle this on.
										} );
									} }
									label={ __( 'Open on click' ) }
								/>

								<ToggleControl
									__nextHasNoMarginBottom
									checked={ showSubmenuIcon }
									onChange={ ( value ) => {
										setAttributes( {
											showSubmenuIcon: value,
										} );
									} }
									disabled={ attributes.openSubmenusOnClick }
									label={ __( 'Show arrow' ) }
								/>

								{ submenuAccessibilityNotice && (
									<div>
										<Notice
											spokenMessage={ null }
											status="warning"
											isDismissible={ false }
										>
											{ submenuAccessibilityNotice }
										</Notice>
									</div>
								) }
							</>
						) }
					</PanelBody>
				) }
			</InspectorControls>
		);

		if ( hasUnsavedBlocks && ! isCreatingNavigationMenu ) {
			return (
				<>
					<BlockEdit { ...props } />
					{ blockEditingMode === 'default' && stylingInspectorControls }
				</>
			);
		}

		if ( ref && isNavigationMenuMissing ) {
			return <BlockEdit { ...props } />;
		}

		if ( isEntityAvailable && hasAlreadyRendered ) {
			return <BlockEdit { ...props } />;
		}

		if ( isPlaceholder && CustomPlaceholder ) {
			return <BlockEdit { ...props } />;
		}

		return (
			<>
				<BlockEdit { ...props } />
				{ blockEditingMode === 'default' && stylingInspectorControls }
			</>
		);
	};
}, 'extendBlockEdit' );

const renderInEditor = createHigherOrderComponent( ( BlockListBlock ) => {
	return ( props ) => {
		if ( ! needToApplyChanges( props ) ) {
			return <BlockListBlock { ...props } />;
		}

		// we add inline style for editor here coz adding in extendBlockEdit() cause infinite loop =(
		const { attributes, clientId } = props;

		const inlineCSS = useMemo(
			() => getInlineCSS( attributes, clientId ),
			[ attributes, clientId ]
		);

		const ref = useAddEditorStyle( inlineCSS, FEATURE_NAME + '__' + clientId );

		return (
			<>
				<DtCrRefAnchor ref={ ref } />
				<BlockListBlock
					{ ...props }
					className={ addCssClasses(
						props.className,
						`${ BLOCK_PREFIX }${ props.clientId } dt-cr-responsive-navigation`
					) }
				/>
			</>
		);
	};
}, 'renderInEditor' );

addFilter(
	'blocks.registerBlockType',
	'dt-cr/navigation/responsiveness/modify-block-data',
	modifyBlockData
);

addFilter( 'editor.BlockEdit', 'dt-cr/navigation/responsiveness/edit-block', extendBlockEdit );

addFilter(
	'editor.BlockListBlock',
	'dt-cr/navigation/responsiveness/render-in-editor',
	renderInEditor
);
