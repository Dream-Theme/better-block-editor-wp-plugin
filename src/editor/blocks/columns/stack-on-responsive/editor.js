import ResponsiveBreakpointControl, {
	BREAKPOINT_OPTION_CUSTOM,
	BREAKPOINT_OPTION_MOBILE,
	BREAKPOINT_OPTION_OFF,
} from '@dt-cr/components/responsive-breakpoint-control';
import ResponsiveBreakpointCustomValue from '@dt-cr/components/responsive-breakpoint-custom-value';
import { BLOCK_PREFIX } from '@dt-cr/constants';
import { addCssClasses } from '@dt-cr/css-classes-utils';
import { DtCrRefAnchor } from '@dt-cr/editor-css-store/components/DtCrRefAnchor';
import { useHandleDeletedUserBreakpoint } from '@dt-cr/hooks/useHandleDeletedUserBreakpoint';
import { getSwitchWidth } from '@dt-cr/responsive';
import { isBlockFullyEditable } from '@dt-cr/utils/utils';
import { InspectorControls, store as blockEditorStore } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import {
	Notice,
	RangeControl,
	ToggleControl,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useDispatch, useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import { useAddEditorStyle } from 'dt-cr/editor-css-store';
import { FEATURE_NAME } from './constants';
import { useToolsPanelDropdownMenuProps } from './dependencies/hooks';
import {
	getMappedColumnWidths,
	getRedistributedColumnWidths,
	hasExplicitPercentColumnWidths,
	toWidthPrecision,
} from './dependencies/utils';
import './editor.scss';

const COLUMN_BLOCK_NAME = 'core/column';
const COLUMNS_BLOCK_NAME = 'core/columns';

function needToApplyChanges( name ) {
	return name === COLUMNS_BLOCK_NAME;
}

/**
 * Try to stay as much close to the original behavior as possible:
 * in case stack on mobile was turned on we turn on our stack on mobile as well
 * and in case it was disabled we turn off our stack on
 * @param {*} attributes
 */
function getBreakpointFromAttributes( attributes ) {
	if ( attributes.dtCrStackOn ) {
		return {
			...attributes.dtCrStackOn,

			// in case we are turning on "Stack On" feature reverseOrder
			// is undefined, but we need to have it defined
			// to avoid React error about controlled / uncontrolled components
			reverseOrder: attributes.dtCrStackOn.reverseOrder ?? false,
		};
	}

	return {
		breakpoint: attributes.isStackedOnMobile ? BREAKPOINT_OPTION_MOBILE : BREAKPOINT_OPTION_OFF,
		breakpointCustomValue: undefined,
		reverseOrder: false,
	};
}

function modifyBlockData( settings, name ) {
	if ( name !== COLUMNS_BLOCK_NAME ) {
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

				reverseOrder: {
					type: 'boolean',
				},
			},
		},
	};
}

function getInlineCSS( attributes, clientId ) {
	const { breakpoint, breakpointCustomValue, reverseOrder } =
		getBreakpointFromAttributes( attributes );

	if ( breakpoint === BREAKPOINT_OPTION_OFF ) {
		return null;
	}

	// prevent the columns from being stacked when custom breakpoint is empty
	// such stacking is caused by core/columns css rules
	const switchWidth = getSwitchWidth( breakpoint, breakpointCustomValue ) ?? '0px';

	const columnsSelector = `.wp-block-columns.${ BLOCK_PREFIX + clientId }`;

	const columnsStackedSelector = `${ columnsSelector }:not(.is-not-stacked-on-mobile)`;

	// to implement stack on mobile in WP code was used next approach:
	// - for .wp-block-column set flex-basis to 100%, flex-grow to 1, flex-wrap: nowrap

	// we use important for flex-wrap to override the original css (important is there already)
	// see ./original.css for details

	return [
		// turn off flex-wrap by default as below we implement another approach for "stack on mobile"
		// feature (i.e. flex-direction instead of flex-basis: 100%)
		`${ columnsSelector } {
			flex-wrap: nowrap !important;
		}`,

		`@media screen and (width <= ${ switchWidth }) {
			${ columnsStackedSelector } {
				flex-direction: ${ reverseOrder ? 'column-reverse' : 'column' } !important;
				align-items: stretch !important;
			}
			
			/* 
				we increase specificity here to overwrite css added in columnRenderInEditor() 
				we change flex-direction, so flex-basis (wich is used to provide width) has no sense any more   
			*/
			${ columnsStackedSelector } > .wp-block-column.wp-block-column.wp-block-column {
				flex-basis: auto !important;
				width: auto;
				flex-grow: 1;
				align-self: auto !important;
			}
		}`,

		`@media screen and (width > ${ switchWidth }) {
			${ columnsStackedSelector } > .wp-block-column {
				flex-basis: 0 !important;
				flex-grow: 1;
			}

			${ columnsStackedSelector } > .wp-block-column[style*=flex-basis] {
				flex-grow: 0;
			}
		}`,
	];
}

// eslint-disable-next-line jsdoc/require-param
/**
 * Mostly copied from `core/columns` implementation (WP6.8.1).
 * @see core/columns
 */

const extendBlockEdit = createHigherOrderComponent( ( BlockEdit ) => {
	return ( props ) => {
		const { attributes, name, setAttributes, clientId, isSelected } = props;

		const { breakpoint, breakpointCustomValue, reverseOrder } =
			getBreakpointFromAttributes( attributes );

		// if breakpoint was deactivated by user, reset to custom one with the same breakpoint value
		useHandleDeletedUserBreakpoint( breakpoint, ( newValue ) => {
			setAttributes( {
				dtCrStackOn: {
					...attributes.dtCrStackOn,
					breakpoint: BREAKPOINT_OPTION_CUSTOM,
					breakpointCustomValue: newValue,
				},
			} );
		} );

		const { count, canInsertColumnBlock, minCount } = useSelect(
			( select ) => {
				const { canInsertBlockType, canRemoveBlock, getBlockOrder } =
					select( blockEditorStore );
				const blockOrder = getBlockOrder( clientId );

				// Get the indexes of columns for which removal is prevented.
				// The highest index will be used to determine the minimum column count.
				const preventRemovalBlockIndexes = blockOrder.reduce( ( acc, blockId, index ) => {
					if ( ! canRemoveBlock( blockId ) ) {
						acc.push( index );
					}
					return acc;
				}, [] );

				return {
					count: blockOrder.length,
					canInsertColumnBlock: canInsertBlockType( 'core/column', clientId ),
					minCount: Math.max( ...preventRemovalBlockIndexes ) + 1,
				};
			},
			[ clientId ]
		);
		const { getBlocks } = useSelect( blockEditorStore );
		const { replaceInnerBlocks } = useDispatch( blockEditorStore );

		/**
		 * Updates the column count, including necessary revisions to child Column
		 * blocks to grant required or redistribute available space.
		 *
		 * @param {number} previousColumns Previous column count.
		 * @param {number} newColumns      New column count.
		 */
		function updateColumns( previousColumns, newColumns ) {
			let innerBlocks = getBlocks( clientId );
			const hasExplicitWidths = hasExplicitPercentColumnWidths( innerBlocks );

			// Redistribute available width for existing inner blocks.
			const isAddingColumn = newColumns > previousColumns;

			if ( isAddingColumn && hasExplicitWidths ) {
				// If adding a new column, assign width to the new column equal to
				// as if it were `1 / columns` of the total available space.
				const newColumnWidth = toWidthPrecision( 100 / newColumns );
				const newlyAddedColumns = newColumns - previousColumns;

				// Redistribute in consideration of pending block insertion as
				// constraining the available working width.
				const widths = getRedistributedColumnWidths(
					innerBlocks,
					100 - newColumnWidth * newlyAddedColumns
				);

				innerBlocks = [
					...getMappedColumnWidths( innerBlocks, widths ),
					...Array.from( {
						length: newlyAddedColumns,
					} ).map( () => {
						return createBlock( 'core/column', {
							width: `${ newColumnWidth }%`,
						} );
					} ),
				];
			} else if ( isAddingColumn ) {
				innerBlocks = [
					...innerBlocks,
					...Array.from( {
						length: newColumns - previousColumns,
					} ).map( () => {
						return createBlock( 'core/column' );
					} ),
				];
			} else if ( newColumns < previousColumns ) {
				// The removed column will be the last of the inner blocks.
				innerBlocks = innerBlocks.slice( 0, -( previousColumns - newColumns ) );
				if ( hasExplicitWidths ) {
					// Redistribute as if block is already removed.
					const widths = getRedistributedColumnWidths( innerBlocks, 100 );

					innerBlocks = getMappedColumnWidths( innerBlocks, widths );
				}
			}

			replaceInnerBlocks( clientId, innerBlocks );
		}

		const dropdownMenuProps = useToolsPanelDropdownMenuProps();

		const inlineCSS = useMemo(
			() => getInlineCSS( attributes, clientId ),
			[ attributes, clientId ]
		);

		const columnsRef = useAddEditorStyle( inlineCSS, FEATURE_NAME + '__' + clientId );

		function updateDtCrStackOnSettings( newSettings ) {
			// fill missed valued with current values
			// we don't use attributes.dtCrStackOn because it may be not updated yet
			newSettings = {
				...{
					breakpoint,
					breakpointCustomValue,
					reverseOrder,
				},
				...newSettings,
			};

			// update core stacked implementation to keep logic solid
			// when we enable/disable this feature or full plugin
			const isStackedOnMobile = newSettings.breakpoint !== BREAKPOINT_OPTION_OFF;

			if ( newSettings.breakpoint === BREAKPOINT_OPTION_OFF ) {
				setAttributes( {
					dtCrStackOn: undefined,
					isStackedOnMobile,
				} );
				return;
			}

			setAttributes( {
				dtCrStackOn: newSettings,
				isStackedOnMobile,
			} );
		}

		// as we replace Columns Settings we need to copy it's behavior
		// in case current block has no columns (only one inner block is allowed for core/columns)
		// we hide it's Settings panel (as core implementation does)
		const hasInnerBlocks = useSelect(
			( select ) => select( blockEditorStore ).getBlocks( clientId ).length > 0,
			[ clientId ]
		);

		if ( ! needToApplyChanges( name ) ) {
			return <BlockEdit { ...props } />;
		}

		return (
			<>
				<DtCrRefAnchor ref={ columnsRef } />

				<BlockEdit { ...props } />

				{ isSelected && hasInnerBlocks && isBlockFullyEditable( clientId ) && (
					<InspectorControls>
						<ToolsPanel
							label={ __( 'Settings', 'bbe' ) }
							className="dt-cr stack-on-with-responsiveness"
							resetAll={ () => {
								updateColumns( count, minCount );
								setAttributes( {
									dtCrStackOn: undefined,
									isStackedOnMobile: true,
								} );
							} }
							dropdownMenuProps={ dropdownMenuProps }
						>
							{ canInsertColumnBlock && (
								<ToolsPanelItem
									label={ __( 'Columns' ) }
									isShownByDefault
									hasValue={ () => count }
									onDeselect={ () => updateColumns( count, minCount ) }
								>
									<VStack spacing={ 4 }>
										<RangeControl
											__nextHasNoMarginBottom
											__next40pxDefaultSize
											label={ __( 'Columns' ) }
											value={ count }
											onChange={ ( value ) =>
												updateColumns( count, Math.max( minCount, value ) )
											}
											min={ Math.max( 1, minCount ) }
											max={ Math.max( 6, count ) }
										/>
										{ count > 6 && (
											<Notice status="warning" isDismissible={ false }>
												{ __(
													'This column count exceeds the recommended amount and may cause visual breakage.'
												) }
											</Notice>
										) }
									</VStack>
								</ToolsPanelItem>
							) }

							<ToolsPanelItem
								label={ __( 'Stack on', 'bbe' ) }
								isShownByDefault
								hasValue={ () => !! attributes.dtCrStackOn }
								onDeselect={ () =>
									updateDtCrStackOnSettings( {
										breakpoint: BREAKPOINT_OPTION_OFF,
									} )
								}
							>
								<ResponsiveBreakpointControl
									label={ __( 'Stack on', 'bbe' ) }
									value={ breakpoint }
									onChange={ ( newValue ) =>
										updateDtCrStackOnSettings( {
											breakpoint: newValue,
											breakpointCustomValue: undefined,
										} )
									}
								/>
								{ breakpoint === BREAKPOINT_OPTION_CUSTOM && (
									<ResponsiveBreakpointCustomValue
										onChange={ ( newValue ) =>
											updateDtCrStackOnSettings( {
												breakpointCustomValue: newValue,
											} )
										}
										value={ breakpointCustomValue }
									/>
								) }
								{ breakpoint !== BREAKPOINT_OPTION_OFF && (
									<ToggleControl
										__nextHasNoMarginBottom
										label={ __( 'Reverse order', 'bbe' ) }
										className="dt-cr stack-on-reverse-order"
										checked={ reverseOrder }
										onChange={ ( newValue ) => {
											updateDtCrStackOnSettings( {
												reverseOrder: newValue,
											} );
										} }
									/>
								) }
							</ToolsPanelItem>
						</ToolsPanel>
					</InspectorControls>
				) }
			</>
		);
	};
}, 'extendBlockEdit' );

const columnsRenderInEditor = createHigherOrderComponent(
	( BlockListBlock ) => ( props ) => {
		const { name, className, clientId } = props;

		if ( ! needToApplyChanges( name ) ) {
			return <BlockListBlock { ...props } />;
		}

		return (
			<BlockListBlock
				{ ...props }
				className={ addCssClasses( className, BLOCK_PREFIX + clientId ) }
			/>
		);
	},
	'columnsRenderInEditor'
);

const columnRenderInEditor = createHigherOrderComponent(
	( BlockListBlock ) => ( props ) => {
		if ( props.name !== COLUMN_BLOCK_NAME || ! props?.attributes.width ) {
			return <BlockListBlock { ...props } />;
		}

		const columnCssClass = BLOCK_PREFIX + props.clientId;
		// in case width was provided in column settings we treat it as flex basis (core logic) and add important here
		// to avoid being overwritten by our logic in getInlineCSS()
		const inlineCSS = `
		.wp-block-columns:not(.is-not-stacked-on-mobile) > .wp-block-column.${ columnCssClass }[style*=flex-basis] {
			flex-basis: ${ props.attributes.width } !important;
		}
		`;

		const columnRef = useAddEditorStyle( inlineCSS, FEATURE_NAME + '__' + props.clientId );

		return (
			<>
				<DtCrRefAnchor ref={ columnRef } />
				<BlockListBlock
					{ ...props }
					className={ addCssClasses( props.className, columnCssClass ) }
				/>
			</>
		);
	},
	'columnRenderInEditor'
);

addFilter(
	'blocks.registerBlockType',
	'dt-cr/columns/stack-on-responsive/modify-block-data',
	modifyBlockData
);

addFilter( 'editor.BlockEdit', 'dt-cr/columns/stack-on-responsive/edit-block', extendBlockEdit );

addFilter(
	'editor.BlockListBlock',
	'dt-cr/columns/stack-on-responsive/columns-render-in-editor',
	columnsRenderInEditor
);

// we have to add separate one for core/column coz if we handle it in addColumnsExtraPropsEditor
// it doesn't handle changes in core/column block width until saved
addFilter(
	'editor.BlockListBlock',
	'dt-cr/columns/stack-on-responsive/column-render-in-editor',
	columnRenderInEditor
);
