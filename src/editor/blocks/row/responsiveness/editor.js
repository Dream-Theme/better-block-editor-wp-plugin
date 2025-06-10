import { BREAKPOINT_OPTION_OFF } from '@dt-cr/components/responsive-breakpoint-control';
import { BLOCK_PREFIX } from '@dt-cr/constants';
import { addCssClasses } from '@dt-cr/css-classes-utils';
import { DtCrRefAnchor } from '@dt-cr/editor-css-store/components/DtCrRefAnchor';
import { getSwitchWidth } from '@dt-cr/responsive';
import { isBlockFullyEditable } from '@dt-cr/utils/utils';
import {
	getSpacingPresetCssVar,
	InspectorControls,
	isValueSpacingPreset,
} from '@wordpress/block-editor';
import { PanelBody } from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useEffect, useMemo, useState } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import { useAddEditorStyle } from 'dt-cr/editor-css-store';
import {
	FEATURE_NAME,
	isOrientationHorizontal,
	isOrientationVertical,
	JUSTIFICATION_VALUES,
	ORIENTATION_VALUES,
	VERTICAL_ALIGNMENT_VALUES,
} from './constants';
import './editor.scss';
import getSettingsFromAttributes from './get-settings-from-attributes';
import StretchWidthSettings from './stretch-width-settings';

const BLOCK_NAME = 'core/group';

function needToApplyChanges( props ) {
	if ( props.name !== BLOCK_NAME ) {
		return false;
	}

	//handle only rows variations
	return props?.attributes?.layout?.type === 'flex';
}

function modifyBlockData( settings, name ) {
	if ( name !== BLOCK_NAME ) {
		return settings;
	}

	return {
		...settings,
		attributes: {
			...settings.attributes,
			dtCrResponsive: {
				breakpoint: {
					type: 'string',
				},
				breakpointCustomValue: {
					type: 'string',
				},
				justification: {
					type: 'string',
				},
				orientation: {
					type: 'string',
				},
				verticalAlignment: {
					type: 'string',
				},
				gap: {
					type: 'string',
				},
			},
		},
	};
}

const horizontalAlignMap = {
	[ JUSTIFICATION_VALUES.LEFT ]: 'flex-start',
	[ JUSTIFICATION_VALUES.RIGHT ]: 'flex-end',
	[ JUSTIFICATION_VALUES.CENTER ]: 'center',
	[ JUSTIFICATION_VALUES.STRETCH ]: 'stretch',
	[ JUSTIFICATION_VALUES.SPACE_BETWEEN ]: 'space-between',
};

const reverseHorizontalAlignMap = {
	...horizontalAlignMap,
	[ JUSTIFICATION_VALUES.LEFT ]: 'flex-end',
	[ JUSTIFICATION_VALUES.RIGHT ]: 'flex-start',
};

const verticalAlignMap = {
	[ VERTICAL_ALIGNMENT_VALUES.TOP ]: 'flex-start',
	[ VERTICAL_ALIGNMENT_VALUES.MIDDLE ]: 'center',
	[ VERTICAL_ALIGNMENT_VALUES.BOTTOM ]: 'flex-end',
	[ VERTICAL_ALIGNMENT_VALUES.STRETCH ]: 'stretch',
	[ VERTICAL_ALIGNMENT_VALUES.SPACE_BETWEEN ]: 'space-between',
};

const reverseVerticalAlignMap = {
	...verticalAlignMap,
	[ VERTICAL_ALIGNMENT_VALUES.TOP ]: 'flex-end',
	[ VERTICAL_ALIGNMENT_VALUES.BOTTOM ]: 'flex-start',
};

function getInlineCSS( attributes, clientId ) {
	const {
		breakpoint,
		breakpointCustomValue,
		justification,
		orientation,
		verticalAlignment,
		gap,
	} = getSettingsFromAttributes( attributes );

	if ( breakpoint === BREAKPOINT_OPTION_OFF ) {
		return null;
	}

	const switchWidth = getSwitchWidth( breakpoint, breakpointCustomValue );
	if ( ! switchWidth ) {
		return null;
	}

	const horizontalAlignmentPropertyName = isOrientationHorizontal( orientation )
		? 'justify-content'
		: 'align-items';

	const horizontalAlignmentMap =
		orientation === ORIENTATION_VALUES.ROW_REVERSE
			? reverseHorizontalAlignMap
			: horizontalAlignMap;

	// add vertical alignment rules, depending on flex orientation use align-items or justify-content
	const verticalAlignmentPropertyName = isOrientationHorizontal( orientation )
		? 'align-items'
		: 'justify-content';

	const verticalAlignmentMap =
		orientation === ORIENTATION_VALUES.COLUMN_REVERSE
			? reverseVerticalAlignMap
			: verticalAlignMap;

	const gapCss = `gap: ${
		isValueSpacingPreset( gap ) ? getSpacingPresetCssVar( gap ) : gap
	} !important;`;

	let cssRules = `.${ BLOCK_PREFIX + clientId } {
		${ horizontalAlignmentPropertyName }:${ horizontalAlignmentMap[ justification ] } !important; 
		${ verticalAlignmentPropertyName }: ${ verticalAlignmentMap[ verticalAlignment ] } !important;
		flex-direction: ${ orientation } !important;
		${ gapCss }
	}`;

	// when we switch orientation direction in responsive mode
	// remove provided flex-basis value from direct children (FSE-3)
	const isLayoutOrientationVertical = attributes?.layout?.orientation === 'vertical';

	if ( isLayoutOrientationVertical !== isOrientationVertical( orientation ) ) {
		cssRules += `.${ BLOCK_PREFIX + clientId } > * {
			flex-basis: auto !important;
		}`;
	}

	return `@media screen and (width <= ${ switchWidth }) {
	 	${ cssRules }
	}`;
}

const extendBlockEdit = createHigherOrderComponent( ( BlockEdit ) => {
	return ( props ) => {
		const { attributes, clientId, isSelected } = props;

		const [ initialOpen, setInitialOpen ] = useState( false );

		// open responsiveness panel only when it's enabled
		useEffect( () => {
			const breakpoint = attributes?.dtCrResponsive?.breakpoint ?? BREAKPOINT_OPTION_OFF;
			if ( breakpoint !== BREAKPOINT_OPTION_OFF ) {
				setInitialOpen( true );
			}
		}, [ attributes?.dtCrResponsive?.breakpoint, setInitialOpen ] );

		const inlineCSS = useMemo(
			() => getInlineCSS( attributes, clientId ),
			[ attributes, clientId ]
		);

		const rowRef = useAddEditorStyle( inlineCSS, FEATURE_NAME + '__' + clientId );

		if ( ! needToApplyChanges( props ) ) {
			return <BlockEdit { ...props } />;
		}

		return (
			<>
				<DtCrRefAnchor ref={ rowRef } />

				<BlockEdit { ...props } />

				{ isSelected && isBlockFullyEditable( clientId ) && (
					<InspectorControls>
						<PanelBody
							title={ __( 'Responsive Settings', 'bbe' ) }
							initialOpen={ initialOpen }
							className="dt-cr row__responsive-stack-on"
						>
							<StretchWidthSettings props={ props } />
						</PanelBody>
					</InspectorControls>
				) }
			</>
		);
	};
}, 'extendBlockEdit' );

const renderInEditor = createHigherOrderComponent(
	( BlockListBlock ) => ( props ) => {
		if ( ! needToApplyChanges( props ) ) {
			return <BlockListBlock { ...props } />;
		}

		return (
			<BlockListBlock
				{ ...props }
				className={ addCssClasses(
					props.className,
					`${ BLOCK_PREFIX }${ props.clientId }`
				) }
			/>
		);
	},
	'renderInEditor'
);

addFilter(
	'blocks.registerBlockType',
	'dt-cr/row/responsiveness/modify-block-data',
	modifyBlockData
);

addFilter( 'editor.BlockEdit', 'dt-cr/row/responsiveness/edit-block', extendBlockEdit );

addFilter( 'editor.BlockListBlock', 'dt-cr/row/responsiveness/render-in-editor', renderInEditor );
