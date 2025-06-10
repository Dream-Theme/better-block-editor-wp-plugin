import { addCssClasses } from '@dt-cr/css-classes-utils';
import { extendWrapperPropsStyle, isBlockFullyEditable } from '@dt-cr/utils/utils';
import { InspectorControls } from '@wordpress/block-editor';
import {
	RangeControl,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import './editor.scss';

const DISABLE_VALUE = '0px';
const BLOCK_NAMES = [ 'core/group', 'core/columns', 'core/column' ];

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
			dtCrBackdropBlur: {
				type: 'string',
			},
		},
	};
}

const extendBlockEdit = createHigherOrderComponent( ( BlockEdit ) => {
	return ( props ) => {
		const {
			attributes: { dtCrBackdropBlur: backdropBlur = DISABLE_VALUE },
			setAttributes,
			name,
			isSelected,
			clientId,
		} = props;

		if ( ! needToApplyChanges( name ) || ! isBlockFullyEditable( clientId ) ) {
			return <BlockEdit { ...props } />;
		}

		return (
			<>
				<BlockEdit { ...props } />

				{ isSelected && (
					<InspectorControls group="styles">
						<ToolsPanel
							label={ __( 'Backdrop Blur', 'bbe' ) }
							className="dt-cr backdrop-blur"
						>
							<ToolsPanelItem
								isShownByDefault
								hasValue={ () => !! backdropBlur }
								label={ __( 'Backdrop Blur', 'bbe' ) }
								onDeselect={ () => {
									setAttributes( {
										dtCrBackdropBlur: undefined,
									} );
								} }
							>
								<RangeControl
									className="backdrop-blur-range-control"
									label={ __( 'Backdrop Blur', 'bbe' ) }
									min={ 0 }
									max={ 10 }
									step={ 1 }
									value={ parseInt( backdropBlur, 10 ) }
									onChange={ ( value ) =>
										setAttributes( {
											dtCrBackdropBlur:
												value === 0 ? undefined : `${ value }px`,
										} )
									}
									__nextHasNoMarginBottom
									__next40pxDefaultSize
								/>
							</ToolsPanelItem>
						</ToolsPanel>
					</InspectorControls>
				) }
			</>
		);
	};
}, 'extendBlockEdit' );

const renderInEditor = createHigherOrderComponent(
	( BlockListBlock ) => ( props ) => {
		const {
			attributes: { dtCrBackdropBlur: backdropBlur = DISABLE_VALUE },
			name,
			wrapperProps = {},
			className,
		} = props;

		if ( ! needToApplyChanges( name ) || backdropBlur === DISABLE_VALUE ) {
			return <BlockListBlock { ...props } />;
		}

		return (
			<BlockListBlock
				{ ...props }
				className={ addCssClasses( className, 'has-backdrop-blur' ) }
				wrapperProps={ extendWrapperPropsStyle( wrapperProps, {
					'--wp--backdrop-blur': `${ backdropBlur }`,
				} ) }
			/>
		);
	},
	'renderInEditor'
);

addFilter(
	'blocks.registerBlockType',
	'dt-cr/__all__/backdrop-blur/modify-block-data',
	modifyBlockData
);

addFilter( 'editor.BlockEdit', 'dt-cr/__all__/backdrop-blur/edit-block', extendBlockEdit );

addFilter(
	'editor.BlockListBlock',
	'dt-cr/__all__/backdrop-blur/render-in-editor',
	renderInEditor
);
