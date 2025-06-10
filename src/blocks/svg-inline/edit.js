import './editor.scss';

import { __ } from '@wordpress/i18n';

import {
	__experimentalImageURLInputUI as ImageURLInputUI,
	BlockControls,
	InspectorControls,
	JustifyToolbar,
	MediaPlaceholder,
	MediaReplaceFlow,
	useBlockProps,
} from '@wordpress/block-editor';

import ToolPanelColorsList from '@dt-cr/components/ToolPanelColorsList';

import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { PanelBody, __experimentalToolsPanel as ToolsPanel } from '@wordpress/components';
import clsx from 'clsx';
import { BLOCK_PREFIX } from '@dt-cr/constants';

import ReactSVG from 'react-inlinesvg';

import { useColorInputUtils } from '@dt-cr/hooks/use-color-input-utils';

import IconSizeControl from '@dt-cr/blocks/svg-inline/components/icon-size-control';

function getImageSize( media ) {
	if ( ! media ) {
		return null;
	}
	const sizes = media.media_details?.sizes ?? media.sizes;
	if ( ! sizes?.full ) {
		return null;
	}
	return sizes.full;
}

const ImageWrapper = ( { href, children, className, style } ) => {
	if ( ! href ) {
		return (
			<div className={ className } style={ style }>
				{ children }
			</div>
		);
	}
	return (
		<a
			href={ href }
			onClick={ ( event ) => event.preventDefault() }
			aria-disabled
			style={ {
				cursor: 'default',
				...style,
			} }
			className={ className }
		>
			{ children }
		</a>
	);
};

export default function Edit( { attributes, setAttributes, clientId } ) {
	const {
		imageURL,
		imageID,
		alignment,
		color,
		fillColor,
		backgroundColor,
		hoverColor,
		hoverFillColor,
		hoverBackgroundColor,
		hoverBorderColor,
		imageWidth,
		href,
		linkDestination,
		linkTarget,
		linkClass,
		rel,
	} = attributes;

	const ALLOWED_TYPES = [ 'image/svg+xml' ];

	const settings = {
		color: 'color',
		fillColor: 'fill-color',
		backgroundColor: 'background-color',
		hoverColor: 'hover-color',
		hoverFillColor: 'hover-fill-color',
		hoverBackgroundColor: 'hover-background-color',
		hoverBorderColor: 'hover-border-color',
		imageWidth: 'width',
	};

	const { attributeToCss } = useColorInputUtils();

	const varDefinitions = {};
	const classDefinitions = {};
	for ( const key in settings ) {
		if ( attributes[ key ] ) {
			if ( ! key.startsWith( 'image' ) ) {
				varDefinitions[ `--svg-${ settings[ key ] }` ] = attributeToCss(
					attributes[ key ]
				);
				classDefinitions[ `has-svg-${ settings[ key ] }` ] = true;
			} else {
				varDefinitions[ `--svg-${ settings[ key ] }` ] = `${ attributes[ key ] }`;
			}
		}
	}

	const blockProps = useBlockProps( {
		className: clsx( `${ BLOCK_PREFIX }${ clientId }`, 'dt-cr-svg-icon', classDefinitions ),
		style: {
			...varDefinitions,
		},
	} );

	const { style, ...containerBlockProps } = blockProps;
	containerBlockProps.style = { justifyContent: alignment };

	const { attributeToInput, inputToAttribute } = useColorInputUtils();
	const onChangeColor = ( colorType, value ) => {
		setAttributes( { [ colorType ]: inputToAttribute( value ) } );
	};

	// Get image from media library
	const { media } = useSelect(
		( select ) => {
			return {
				media: imageID ? select( coreStore ).getMedia( imageID ) : undefined,
			};
		},
		[ imageID ]
	);

	// eslint-disable-next-line no-shadow
	const onImageSelect = ( media ) => {
		const image = getImageSize( media );
		if ( ! image ) {
			return;
		}

		const { url: fullUrl, source_url: sourceUrl } = image;
		const url = media.url ?? fullUrl ?? sourceUrl;

		setAttributes( {
			imageURL: url,
			imageID: media.id,
		} );
	};

	function onSetHref( props ) {
		setAttributes( props );
	}

	const onReplaceError = ( message ) => {
		// eslint-disable-next-line no-console
		console.warn( `SVG replace Error. ${ message }` );
	};
	const allowedControls = [ 'left', 'center', 'right' ];

	const panelId = 'svg-inline-styling-' + clientId;

	return (
		<>
			{ imageURL && (
				<>
					<InspectorControls>
						<PanelBody title={ __( 'SVG Settings', 'bbe' ) }>
							<IconSizeControl
								size={ imageWidth }
								onChange={ ( value ) => {
									setAttributes( { imageWidth: value } );
								} }
							/>
						</PanelBody>
					</InspectorControls>
					<InspectorControls group="styles">
						<ToolsPanel
							panelId={ panelId }
							className="svg-icon-color-panel"
							label={ __( 'Color', 'bbe' ) }
							__experimentalFirstVisibleItemClass="first"
							__experimentalLastVisibleItemClass="last"
						>
							<ToolPanelColorsList
								__experimentalIsRenderedInSidebar
								panelId={ panelId }
								settings={ [
									{
										enableAlpha: true,
										clearable: true,
										colorValue: attributeToInput( color ),
										onColorChange: ( value ) => onChangeColor( 'color', value ),
										label: __( 'Stroke', 'bbe' ),
									},
									{
										enableAlpha: true,
										clearable: true,
										colorValue: attributeToInput( fillColor ),
										onColorChange: ( value ) =>
											onChangeColor( 'fillColor', value ),
										label: __( 'Fill', 'bbe' ),
									},
									{
										enableAlpha: true,
										clearable: true,
										colorValue: attributeToInput( backgroundColor ),
										onColorChange: ( value ) =>
											onChangeColor( 'backgroundColor', value ),
										label: __( 'Background', 'bbe' ),
									},
								] }
							/>
						</ToolsPanel>
						<ToolsPanel
							panelId={ panelId }
							className="svg-icon-color-hover-panel"
							label={ __( 'Hover Color', 'bbe' ) }
							__experimentalFirstVisibleItemClass="first"
							__experimentalLastVisibleItemClass="last"
						>
							<ToolPanelColorsList
								__experimentalIsRenderedInSidebar
								panelId={ panelId }
								className="svg-icon-hover-color-panel"
								settings={ [
									{
										enableAlpha: true,
										clearable: true,
										colorValue: attributeToInput( hoverColor ),
										onColorChange: ( value ) =>
											onChangeColor( 'hoverColor', value ),
										label: __( 'Stroke', 'bbe' ),
									},
									{
										enableAlpha: true,
										clearable: true,
										colorValue: attributeToInput( hoverFillColor ),
										onColorChange: ( value ) =>
											onChangeColor( 'hoverFillColor', value ),
										label: __( 'Fill', 'bbe' ),
									},
									{
										enableAlpha: true,
										clearable: true,
										colorValue: attributeToInput( hoverBackgroundColor ),
										onColorChange: ( value ) =>
											onChangeColor( 'hoverBackgroundColor', value ),
										label: __( 'Background', 'bbe' ),
									},
									{
										enableAlpha: true,
										clearable: true,
										colorValue: attributeToInput( hoverBorderColor ),
										onColorChange: ( value ) =>
											onChangeColor( 'hoverBorderColor', value ),
										label: __( 'Border', 'bbe' ),
									},
								] }
							/>
						</ToolsPanel>
					</InspectorControls>
					<BlockControls>
						<JustifyToolbar
							allowedControls={ allowedControls }
							value={ alignment }
							onChange={ ( newVal ) => setAttributes( { alignment: newVal } ) }
						/>
						<ImageURLInputUI
							url={ href || '' }
							onChangeUrl={ onSetHref }
							linkDestination={ linkDestination }
							mediaUrl={ imageURL }
							mediaLink={ media && media.link }
							linkTarget={ linkTarget }
							linkClass={ linkClass }
							rel={ rel }
							showLightboxSetting={ false }
							lightboxEnabled={ false }
						/>
						<MediaReplaceFlow
							mediaId={ imageID }
							mediaURL={ imageURL }
							allowedTypes={ ALLOWED_TYPES }
							accept={ ALLOWED_TYPES }
							onSelect={ onImageSelect }
							onError={ onReplaceError }
						/>
					</BlockControls>
				</>
			) }
			{ ! imageURL && (
				<MediaPlaceholder
					allowedTypes={ ALLOWED_TYPES }
					accept={ ALLOWED_TYPES }
					onSelect={ onImageSelect }
					value={ imageID }
					labels={ {
						title: __( 'Inline SVG', 'bbe' ),
						instructions: __(
							'Upload an SVG or pick one from your media library.',
							'dt-cr'
						),
					} }
				/>
			) }

			{ imageURL && (
				<div { ...containerBlockProps }>
					<ImageWrapper style={ style } className={ 'svg-wrapper' } href={ href }>
						{ <ReactSVG src={ imageURL } /> }
					</ImageWrapper>
				</div>
			) }
		</>
	);
}
