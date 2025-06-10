<?php
/**
 * Responsive settings for some text blocks
 *
 * @package BetterBlockEditor
 */

namespace BetterBlockEditor\Modules\TextResponsive;

use BetterBlockEditor\Base\ManagableModuleInterface;
use BetterBlockEditor\Base\ModuleBase;
use BetterBlockEditor\Core\BlockUtils;
use BetterBlockEditor\Core\CssMediaBreakpoints;

defined( 'ABSPATH' ) || exit;

class Module extends ModuleBase implements ManagableModuleInterface {

	const MODULE_IDENTIFIER = 'text-responsive';
	const ASSETS_BUILD_PATH = 'editor/blocks/__all__/text-responsive/';

	const SETTINGS_ORDER = 1400;

	const ATTRIBUTES                        = 'dtCrResponsiveText';
	const ATTRIBUTE_BREAKPOINT              = 'breakpoint';
	const ATTRIBUTE_BREAKPOINT_CUSTOM_VALUE = 'breakpointCustomValue';

	const BlOCK_NAMES = array( 'core/post-title', 'core/post-excerpt', 'core/heading', 'core/paragraph' );

	public function setup_hooks() {
		add_filter( 'render_block', array( $this, 'render' ), 20, 3 );
	}

	function render( $block_content, $block ) {
		if ( ! in_array( $block['blockName'] ?? null, self::BlOCK_NAMES ) || $block_content === '' ) {
			return $block_content;
		}

		$attributes = $block['attrs'] ?? array();

		$switch_width = CssMediaBreakpoints::getSwitchWidth(
			$attributes[ self::ATTRIBUTES ][ self::ATTRIBUTE_BREAKPOINT ] ?? null,
			$attributes[ self::ATTRIBUTES ][ self::ATTRIBUTE_BREAKPOINT_CUSTOM_VALUE ] ?? null
		);

		$alignment = $attributes[ self::ATTRIBUTES ]['settings']['alignment'] ?? null;

		if ( null === $switch_width || ! $alignment ) {
			return $block_content;
		}

		$class_id      = BlockUtils::get_unique_class_id( $block_content );
		$block_content = BlockUtils::append_classes( $block_content, array( $class_id ) );

		BlockUtils::add_styles_from_css_rules(
			array(
				array(
					'selector'     => "@media screen and (width <= {$switch_width})",
					'declarations' => array(
						array(
							'selector'     => 'body .' . $class_id,
							'declarations' => array( 'text-align' => $alignment ),
						),
					),
				),
			)
		);

		return $block_content;
	}

	public static function get_title() {
		return __( 'Responsive Text Alignment', 'bbe' );
	}

	public static function get_label() {
		return __( 'Add responsive text alignment settings to Header, Paragraph, Post Title and Post Excerpt blocks.', 'bbe' );
	}
}
