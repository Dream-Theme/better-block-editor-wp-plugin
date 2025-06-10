<?php
/**
 * Adds responsive visibility settings to all blocks.
 *
 * @package BetterBlockEditor
 */

namespace BetterBlockEditor\Modules\Visibility;

use BetterBlockEditor\Base\ManagableModuleInterface;
use BetterBlockEditor\Base\ModuleBase;
use BetterBlockEditor\Core\BlockUtils;
use BetterBlockEditor\Core\CssMediaBreakpoints;

defined( 'ABSPATH' ) || exit;

class Module extends ModuleBase implements ManagableModuleInterface {

	const MODULE_IDENTIFIER        = 'block-responsive-visibility';
	const ASSETS_BUILD_PATH        = 'editor/blocks/__all__/visibility/';
	const PLUGIN_ASSETS_BUILD_PATH = 'editor/plugins/visibility/';

	const SETTINGS_ORDER = 100;

	const ATTRIBUTES = 'dtCrVisibility';

	/**
	 * add visibility plugin assets to editor (displays show/hide button in top toolbar)
	 */
	public function init() {
		parent::init();

		$asset_file = require DT_CR_DIST . $this::PLUGIN_ASSETS_BUILD_PATH . 'editor.asset.php';
		wp_register_script(
			$this->build_script_handle( 'editor-plugin' ),
			DT_CR_URL_DIST . $this::PLUGIN_ASSETS_BUILD_PATH . $this::EDITOR_ASSET_KEY . '.js',
			$asset_file['dependencies'],
			$asset_file['version'],
			array(
				'strategy'  => 'defer',
				'in_footer' => true,
			)
		);

		if ( file_exists( DT_CR_DIST . $this::PLUGIN_ASSETS_BUILD_PATH . $this::EDITOR_ASSET_KEY . '.css' ) ) {
			wp_register_style(
				$this->build_style_handle( 'editor-plugin' ),
				DT_CR_URL_DIST . $this::PLUGIN_ASSETS_BUILD_PATH . $this::EDITOR_ASSET_KEY . '.css',
				array(),
				$asset_file['version']
			);
		}

		add_action(
			'enqueue_block_editor_assets',
			function () {
				$this->enqueue_assets( 'editor-plugin' );
			}
		);
	}

	public function setup_hooks() {
		add_filter( 'render_block', array( $this, 'render' ), 20, 2 );
	}

	public function render( $block_content, $block ) {
		$attributes = isset( $block['attrs'] ) ? $block['attrs'] : null;

		if ( ! isset( $attributes[ self::ATTRIBUTES ] ) || $block_content === '' ) {
			return $block_content;
		}

		$class_id = BlockUtils::get_unique_class_id( $block_content );

		$custom_classes = $this->get_custom_classes( $attributes, $class_id );
		$block_content  = BlockUtils::append_classes( $block_content, $custom_classes );

		$this->add_styles( $attributes, $class_id );

		return $block_content;
	}

	/**
	 * @param array $attributes Block attributes.
	 *
	 * @return string[] Custom classes to be added on render.
	 */
	public function get_custom_classes( $attributes, $class_id ) {
		$custom_classes = array();

		$atts = $this->get_atts( $attributes[ self::ATTRIBUTES ] );

		$visibility = $atts['visibility'];
		$breakpoint = $atts['breakpoint'];

		// hidden can applied even without breakpoint
		if ( $visibility === 'hidden' || $breakpoint !== CssMediaBreakpoints::BREAKPOINT_NAME_OFF ) {
			$custom_classes[] = $class_id;
			$custom_classes[] = 'dt-cr-visibility-' . ( empty( $visibility ) ? 'visible' : $visibility );
			// only to indicate that some breakpoint exists for this element
			if ( $breakpoint !== CssMediaBreakpoints::BREAKPOINT_NAME_OFF ) {
				$custom_classes[] = 'dt-cr-visibility-breakpoint-' . $breakpoint;
			}
		}

		return apply_filters( 'dt-cr_blocks_get_custom_classes', $custom_classes, $attributes );
	}

	public function get_atts( $attributes ) {
		return wp_parse_args(
			$attributes,
			array(
				'visibility'            => '',
				'breakpoint'            => '',
				'breakpointCustomValue' => '',
			)
		);
	}

	public function add_styles( $attributes, $class_id ) {
		$atts             = $this->get_atts( $attributes[ self::ATTRIBUTES ] );
		$visibility       = $atts['visibility'];
		$breakpoint       = $atts['breakpoint'];
		$breakpoint_value = $atts['breakpointCustomValue'];

		$switch_width = CssMediaBreakpoints::getSwitchWidth( $breakpoint, $breakpoint_value );

		if ( $switch_width ) {
			$visibility_declaration = $visibility === 'hidden'
				? array(
					'selector'     => ".dt-cr-visibility-hidden.{$class_id}.{$class_id}",
					'declarations' => array( 'display' => 'flex !important' ),
				)
				: array(
					'selector'     => ".dt-cr-visibility-visible.{$class_id}.{$class_id}",
					'declarations' => array( 'display' => 'none !important' ),
				);

			BlockUtils::add_styles_from_css_rules(
				array(
					array(
						'selector'     => "@media screen and (width <= {$switch_width})",
						'declarations' => array( $visibility_declaration ),
					),
				)
			);
		}
	}

	public static function get_title() {
		return __( 'Blocks Visibility', 'bbe' );
	}

	public static function get_label() {
		return __( 'Add responsive Visibility settings to all blocks.', 'bbe' );
	}
}
