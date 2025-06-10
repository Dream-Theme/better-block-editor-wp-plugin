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
import { isBlockFullyEditable } from '@dt-cr/utils/utils';
import { InspectorControls } from '@wordpress/block-editor';
import { PanelBody } from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useMemo, useState } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import { useAddEditorStyle } from 'dt-cr/editor-css-store';
import { FEATURE_NAME, TEXT_ALIGNMENT_VALUES } from './constants';
import './editor.scss';
import TextAlignmentControl from './text-alignment-control';

const BLOCK_NAMES = [ 'core/post-title', 'core/post-excerpt', 'core/heading', 'core/paragraph' ];
const DEFAULT_TEXT_ALIGNMENT = TEXT_ALIGNMENT_VALUES.LEFT;

function getDefautlTextAlignment( attributes, name ) {
	// paragraph stores alignment in another attribute
	return (
		attributes[ name === 'core/paragraph' ? 'align' : 'textAlign' ] ?? DEFAULT_TEXT_ALIGNMENT
	);
}

function needToApplyChanges( name ) {
	return BLOCK_NAMES.includes( name );
}

function modifyBlockData( settings, name ) {
	if ( ! needToApplyChanges( name ) ) {
		return settings;
	}

	return {
		...settings,
		attributes: {
			...settings.attributes,
			dtCrResponsiveText: {
				breakpoint: {
					type: 'string',
				},

				breakpointCustomValue: {
					type: 'string',
				},

				settings: {
					alignment: {
						enum: [
							TEXT_ALIGNMENT_VALUES.LEFT,
							TEXT_ALIGNMENT_VALUES.CENTER,
							TEXT_ALIGNMENT_VALUES.RIGHT,
						],
					},
				},
			},
		},
	};
}

function getInlineCSS( attributes, clientId ) {
	const {
		breakpoint,
		breakpointCustomValue,
		settings: { alignment } = {},
	} = attributes.dtCrResponsiveText ?? {};

	const switchWidth = getSwitchWidth( breakpoint, breakpointCustomValue );

	if ( ! switchWidth ) {
		return null;
	}

	// we use body in css selector only to increase specificity and overwrite default style
	return `@media screen and (width <= ${ switchWidth }) {
		body .${ BLOCK_PREFIX + clientId } {
			text-align: ${ alignment };
		}
	}`;
}

const extendBlockEdit = createHigherOrderComponent( ( BlockEdit ) => {
	return ( props ) => {
		const {
			name,
			attributes,
			attributes: {
				dtCrResponsiveText: {
					settings: { alignment = getDefautlTextAlignment( attributes, name ) } = {},
					breakpoint = BREAKPOINT_OPTION_OFF,
					breakpointCustomValue,
				} = {},
			},
			attributes: { dtCrResponsiveText },
			setAttributes,
			isSelected,
			clientId,
		} = props;

		// if breakpoint was deactivated by user, reset to custom one with the same breakpoint value
		useHandleDeletedUserBreakpoint( breakpoint, ( newValue ) =>
			updateAttributes( {
				breakpoint: BREAKPOINT_OPTION_CUSTOM,
				breakpointCustomValue: newValue,
			} )
		);

		const updateAttributes = ( newAttributes ) => {
			if ( BREAKPOINT_OPTION_OFF === newAttributes.breakpoint ) {
				setAttributes( { dtCrResponsiveText: undefined } );
				return;
			}

			setAttributes( {
				dtCrResponsiveText: {
					...dtCrResponsiveText,
					...newAttributes,
				},
			} );
		};

		const [ isOpen ] = useState( !! dtCrResponsiveText );

		const inlineCSS = useMemo(
			() => getInlineCSS( attributes, clientId ),
			[ attributes, clientId ]
		);

		const ref = useAddEditorStyle( inlineCSS, FEATURE_NAME + '__' + clientId );

		if ( ! needToApplyChanges( name ) ) {
			return <BlockEdit { ...props } />;
		}

		const helpText = __( 'Change text alignment at this breakpoint and below.', 'bbe' );

		return (
			<>
				<DtCrRefAnchor ref={ ref } />

				<BlockEdit { ...props } />

				{ isSelected && isBlockFullyEditable( clientId ) && (
					<InspectorControls>
						<PanelBody
							title={ __( 'Responsive Settings', 'bbe' ) }
							initialOpen={ isOpen || !! dtCrResponsiveText }
							className="dt-cr text-responsive"
						>
							<ResponsiveBreakpointControl
								label={ __( 'Breakpoint', 'bbe' ) }
								value={ breakpoint }
								onChange={ ( newValue ) =>
									updateAttributes( {
										breakpoint: newValue,
										breakpointCustomValue: undefined,
									} )
								}
								help={ breakpoint !== BREAKPOINT_OPTION_CUSTOM ? helpText : null }
							/>
							{ breakpoint === BREAKPOINT_OPTION_CUSTOM && (
								<ResponsiveBreakpointCustomValue
									onChange={ ( newValue ) => {
										updateAttributes( {
											breakpointCustomValue: newValue,
										} );
									} }
									value={ breakpointCustomValue }
									help={ helpText }
								/>
							) }
							{ breakpoint !== BREAKPOINT_OPTION_OFF && (
								<TextAlignmentControl
									label={ __( 'Text alignment', 'bbe' ) }
									value={ alignment }
									onChange={ ( newValue ) =>
										updateAttributes( { settings: { alignment: newValue } } )
									}
								/>
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
		const { attributes: { dtCrResponsiveText } = {}, name, className, clientId } = props;

		if ( ! needToApplyChanges( name ) || ! dtCrResponsiveText ) {
			return <BlockListBlock { ...props } />;
		}

		return (
			<BlockListBlock
				{ ...props }
				className={ addCssClasses( className, BLOCK_PREFIX + clientId ) }
			/>
		);
	},
	'renderInEditor'
);

addFilter(
	'blocks.registerBlockType',
	'dt-cr/__all__/text-responsive/modify-block-data',
	modifyBlockData
);

addFilter( 'editor.BlockEdit', 'dt-cr/__all__/text-responsive/edit-block', extendBlockEdit );

addFilter(
	'editor.BlockListBlock',
	'dt-cr/__all__/text-responsive/render-in-editor',
	renderInEditor
);
