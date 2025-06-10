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
import {
	InspectorControls,
	getSpacingPresetCssVar,
	isValueSpacingPreset,
} from '@wordpress/block-editor';
import { BaseControl, PanelBody } from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useMemo, useState } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import { useAddEditorStyle } from 'dt-cr/editor-css-store';
import { FEATURE_NAME } from './constants';
import './editor.scss';
import BlockSpacingControl from '@dt-cr/components/block-spacing-control';

const BLOCK_NAME = 'core/post-template';

function needToApplyChanges( attributes, name ) {
	if ( name !== BLOCK_NAME ) {
		return false;
	}

	return attributes?.layout?.type === 'grid';
}

function getResponsiveSettings( attributes ) {
	const {
		breakpoint = BREAKPOINT_OPTION_OFF,
		breakpointCustomValue,
		settings: { gap } = {},
	} = attributes.dtCrStackOn ?? {};

	return {
		breakpoint,
		breakpointCustomValue,
		settings: { gap },
	};
}

function modifyBlockData( settings, name ) {
	if ( name !== BLOCK_NAME ) {
		return settings;
	}

	return {
		...settings,
		attributes: {
			...settings.attributes,
			dtCrStackOn: {
				breakpoint: {
					type: 'string',
				},
				breakpointCustomValue: {
					type: 'string',
				},
			},

			settings: {
				gap: {
					type: 'string',
				},
			},
		},
	};
}

function getInlineCSS( attributes, clientId ) {
	const {
		breakpoint,
		breakpointCustomValue,
		settings: { gap },
	} = getResponsiveSettings( attributes );

	const switchWidth = getSwitchWidth( breakpoint, breakpointCustomValue );

	if ( ! switchWidth ) {
		return null;
	}

	const gapCssRule = gap
		? `gap: ${ isValueSpacingPreset( gap ) ? getSpacingPresetCssVar( gap ) : gap } !important;`
		: '';

	return `@media screen and (width <= ${ switchWidth }) {
		body .${ BLOCK_PREFIX + clientId } {
			${ gapCssRule }
			grid-template-columns: repeat(1, 1fr) !important;
		}
	}`;
}

const extendBlockEdit = createHigherOrderComponent( ( BlockEdit ) => {
	return ( props ) => {
		const { attributes, clientId, setAttributes, isSelected, name } = props;

		const {
			breakpoint,
			breakpointCustomValue,
			settings: { gap },
		} = getResponsiveSettings( attributes );

		// if breakpoint was deactivated by user, reset to custom one with the same breakpoint value
		useHandleDeletedUserBreakpoint( breakpoint, ( newValue ) =>
			updateAttributes( {
				breakpoint: BREAKPOINT_OPTION_CUSTOM,
				breakpointCustomValue: newValue,
			} )
		);

		const updateAttributes = ( newValue ) => {
			if ( BREAKPOINT_OPTION_OFF === newValue.breakpoint ) {
				setAttributes( { dtCrStackOn: undefined } );
				return;
			}

			setAttributes( {
				dtCrStackOn: {
					...attributes.dtCrStackOn,
					...newValue,
				},
			} );
		};

		const [ isOpen ] = useState( !! attributes.dtCrStackOn );

		const inlineCSS = useMemo(
			() => getInlineCSS( attributes, clientId ),
			[ attributes, clientId ]
		);

		const ref = useAddEditorStyle( inlineCSS, FEATURE_NAME + '__' + clientId );

		if ( ! needToApplyChanges( attributes, name ) ) {
			return <BlockEdit { ...props } />;
		}

		return (
			<>
				<DtCrRefAnchor ref={ ref } />

				<BlockEdit { ...props } />

				{ isSelected && isBlockFullyEditable( clientId ) && (
					<InspectorControls>
						<PanelBody
							title={ __( 'Responsive Settings', 'bbe' ) }
							initialOpen={ isOpen || !! attributes.dtCrStackOn }
							className="dt-cr post-template__responsive-stack-on"
						>
							<ResponsiveBreakpointControl
								label={ __( 'Stack on', 'bbe' ) }
								value={ breakpoint }
								onChange={ ( newValue ) =>
									updateAttributes( {
										breakpoint: newValue,
										breakpointCustomValue: undefined,
									} )
								}
							/>
							{ breakpoint === BREAKPOINT_OPTION_CUSTOM && (
								<ResponsiveBreakpointCustomValue
									onChange={ ( newValue ) =>
										updateAttributes( { breakpointCustomValue: newValue } )
									}
									value={ breakpointCustomValue }
								/>
							) }
							{ breakpoint !== BREAKPOINT_OPTION_OFF && (
								<BaseControl __nextHasNoMarginBottom>
									<BlockSpacingControl
										value={ gap }
										label={ __( 'Block spacing', 'bbe' ) }
										onChange={ ( newValue ) =>
											updateAttributes( { settings: { gap: newValue } } )
										}
									/>
								</BaseControl>
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
		const { attributes, name, className, clientId } = props;

		if ( ! needToApplyChanges( attributes, name ) ) {
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
	'dt-cr/post-template/stack-on-responsive/modify-block-data',
	modifyBlockData
);
addFilter(
	'editor.BlockEdit',
	'dt-cr/post-template/stack-on-responsive/edit-block',
	extendBlockEdit
);
addFilter(
	'editor.BlockListBlock',
	'dt-cr/post-template/stack-on-responsive/render-in-editor',
	renderInEditor
);
