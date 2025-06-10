<?php
/**
 * Adds responsiveness settings to Post Template block.
 *
 * @package BetterBlockEditor
 */

namespace BetterBlockEditor\Modules\PostTemplateResponsive;

use BetterBlockEditor\Base\ModuleBase;
use BetterBlockEditor\Base\ManagableModuleInterface;
use BetterBlockEditor\Core\BlockUtils;
use BetterBlockEditor\Core\CssMediaBreakpoints;

defined( 'ABSPATH' ) || exit;

class Module extends ModuleBase implements ManagableModuleInterface {

	const MODULE_IDENTIFIER = 'post-template-stack-on-responsive';
	const ASSETS_BUILD_PATH = 'editor/blocks/post-template/stack-on-responsive/';

	const ATTRIBUTES                        = 'dtCrStackOn';
	const ATTRIBUTE_BREAKPOINT              = 'breakpoint';
	const ATTRIBUTE_BREAKPOINT_CUSTOM_VALUE = 'breakpointCustomValue';

	const BlOCK_NAME = 'core/post-template';

	const SETTINGS_ORDER = 900;

	public function setup_hooks() {
		add_filter( 'render_block', array( $this, 'render' ), 20, 3 );
	}

	function render( $block_content, $block ) {
		if ( ( $block['blockName'] ?? null ) !== self::BlOCK_NAME || $block_content === '' ) {
			return $block_content;
		}

		$attributes = $block['attrs'] ?? array();

		if ( ( $attributes['layout']['type'] ?? null ) !== 'grid' || ! isset( $attributes[ self::ATTRIBUTES ] ) ) {
			return $block_content;
		}

		$switch_width = CssMediaBreakpoints::getSwitchWidth(
			$attributes[ self::ATTRIBUTES ][ self::ATTRIBUTE_BREAKPOINT ] ?? null,
			$attributes[ self::ATTRIBUTES ][ self::ATTRIBUTE_BREAKPOINT_CUSTOM_VALUE ] ?? null
		);

		if ( null === $switch_width ) {
			return $block_content;
		}

		$class_id      = BlockUtils::get_unique_class_id( $block_content );
		$block_content = BlockUtils::append_classes( $block_content, array( $class_id ) );

		$css_rules = array( 'grid-template-columns' => 'repeat(1, 1fr) !important' );

		$gap = $attributes[ self::ATTRIBUTES ]['settings']['gap'] ?? null;
		// need strict comparison here as gap may be 0
		if ( null !== $gap ) {
			$css_rules['gap'] = $gap . ' !important';
		}

		BlockUtils::add_styles_from_css_rules(
			array(
				array(
					'selector'     => "@media screen and (width <= {$switch_width})",
					'declarations' => array(
						array(
							'selector'     => 'body .' . $class_id,
							'declarations' => $css_rules,
						),
					),
				),
			)
		);

		return $block_content;
	}



	public static function get_title() {
		return __( 'Responsive Post Template', 'bbe' );
	}

	public static function get_label() {
		return __( 'Add responsiveness settings to Post Template block.', 'bbe' );
	}
}
