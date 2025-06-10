<?php
/**
 * Extend Row block
 *
 * @package BetterBlockEditor
 */

namespace BetterBlockEditor\Modules\RowResponsive;

use BetterBlockEditor\Base\ManagableModuleInterface;
use BetterBlockEditor\Base\ModuleBase;
use BetterBlockEditor\Core\BlockUtils;
use BetterBlockEditor\Core\CssMediaBreakpoints;

defined( 'ABSPATH' ) || exit;

class Module extends ModuleBase implements ManagableModuleInterface {

	const MODULE_IDENTIFIER = 'row-responsive';
	const ASSETS_BUILD_PATH = 'editor/blocks/row/responsiveness/';

	const SETTINGS_ORDER = 200;

	const ATTRIBUTES = 'dtCrResponsive';
	const BlOCK_NAME = 'core/group';

	public function setup_hooks() {
		add_filter( 'render_block', array( $this, 'render' ), 20, 3 );
	}

	function render( $block_content, $block ) {
		if ( ( $block['blockName'] ?? null ) !== self::BlOCK_NAME || $block_content === '' ) {
			return $block_content;
		}

		$attributes = isset( $block['attrs'] ) ? $block['attrs'] : null;

		if ( ! isset( $attributes['layout'] ) || ! isset( $attributes['layout']['type'] ) || $attributes['layout']['type'] !== 'flex' || ! isset( $attributes[ self::ATTRIBUTES ] ) ) {
			return $block_content;
		}

		$class_id       = BlockUtils::get_unique_class_id( $block_content );
		$custom_classes = $this->get_custom_classes( $attributes, $class_id );
		$block_content  = BlockUtils::append_classes( $block_content, $custom_classes );
		$this->add_styles( $attributes, $class_id );

		return $block_content;
	}

	/**
	 * @param array $attributes Block attributes.
	 *
	 * @return array Custom classes to be added on render.
	 */
	function get_custom_classes( $attributes, $class_id ) {
		$custom_classes = array();

		$custom_classes[] = $class_id;

		return $custom_classes;
	}

	function add_styles( $attributes, $class_id ) {
		$dt_cr_responsive = wp_parse_args(
			$attributes[ self::ATTRIBUTES ],
			array(
				'breakpoint'            => null,
				'breakpointCustomValue' => null,
				'orientation'           => null,
				'justification'         => null,
				'verticalAlignment'     => null,
				'gap'                   => null,
			)
		);

		$breakpoint              = $dt_cr_responsive['breakpoint'] ?? null;
		$breakpoint_custom_value = $dt_cr_responsive['breakpointCustomValue'] ?? null;
		$justification           = $dt_cr_responsive['justification'] ?? 'left';
		$orientation             = $dt_cr_responsive['orientation'] ?? 'row';
		$vertical_alignment      = $dt_cr_responsive['verticalAlignment'] ?? 'top';
		$gap                     = $dt_cr_responsive['gap'] ?? null;

		$switch_width = CssMediaBreakpoints::getSwitchWidth( $breakpoint, $breakpoint_custom_value );
		if ( ! $switch_width ) {
			return;
		}

		// Used with the default, horizontal(row) flex orientation.
		$horizontal_alignment_map = array(
			'left'          => 'flex-start',
			'right'         => 'flex-end',
			'center'        => 'center',
			'stretch'       => 'stretch',
			'space-between' => 'space-between',
		);

		$horizontal_alignment_reverse_map = array_merge(
			$horizontal_alignment_map,
			array(
				'left'  => 'flex-end',
				'right' => 'flex-start',
			)
		);

		$vertical_alignment_map = array(
			'top'           => 'flex-start',
			'bottom'        => 'flex-end',
			'center'        => 'center',
			'stretch'       => 'stretch',
			'space-between' => 'space-between',
		);

		$vertical_alignment_reverse_map = array_merge(
			$vertical_alignment_map,
			array(
				'top'    => 'flex-end',
				'bottom' => 'flex-start',
			)
		);

		$declarations = array();

		if ( $orientation === 'row' || $orientation === 'row-reverse' ) {
			// horizontal orientation
			$horizontal_alignment_property_name = 'justify-content';
			$vertical_alignment_property_name   = 'align-items';
		} else {
			// vertical orientation
			$horizontal_alignment_property_name = 'align-items';
			$vertical_alignment_property_name   = 'justify-content';
		}

		if ( $orientation === 'row-reverse' ) {
			$horizontal_alignment_map = $horizontal_alignment_reverse_map;
		}

		if ( $orientation === 'column-reverse' ) {
			$vertical_alignment_map = $vertical_alignment_reverse_map;
		}

		$declarations[ $horizontal_alignment_property_name ] = $horizontal_alignment_map[ $justification ] . ' !important';
		$declarations[ $vertical_alignment_property_name ]   = $vertical_alignment_map[ $vertical_alignment ] . ' !important';

		$declarations['flex-direction'] = "{$orientation}";

		// add gap if provided
		if ( $gap !== null ) {
			$declarations['gap'] = $gap . ' !important';
		}

		$css_rules = array(
			array(
				'selector'     => "@media screen and (width <= {$switch_width})",
				'declarations' => array(
					array(
						'selector'     => "body .{$class_id}.{$class_id}",
						'declarations' => $declarations,
					),

				),
			),
		);

		// when we switch orientation direction in responsive mode
		// remove provided flex-basis value from direct children (FSE-3)
		// by default group flex orientation is horizontal (even if it's not set in attributes)
		$layout_orientation     = $attributes['layout']['orientation'] ?? 'horizontal';
		$responsive_orientation = in_array( $orientation, array( 'row', 'row-reverse' ) ) ? 'horizontal' : 'vertical';
		if ( $layout_orientation !== $responsive_orientation ) {
			$remove_flex_basis_css = array(
				'selector'     => "body .{$class_id}.{$class_id} > *",
				'declarations' => array(
					'flex-basis' => 'auto !important',
				),
			);

			array_push( $css_rules[0]['declarations'], $remove_flex_basis_css );
		}

		BlockUtils::add_styles_from_css_rules( $css_rules );
	}

	public static function get_title() {
		return __( 'Responsive Rows', 'bbe' );
	}

	public static function get_label() {
		return __( 'Add responsiveness settings to Row block.', 'bbe' );
	}
}
