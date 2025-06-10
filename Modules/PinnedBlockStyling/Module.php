<?php
/**
 * Style blocks with position "sticky"
 *
 * @package BetterBlockEditor
 */

namespace BetterBlockEditor\Modules\PinnedBlockStyling;

use BetterBlockEditor\Base\ManagableModuleInterface;
use BetterBlockEditor\Base\ModuleBase;
use BetterBlockEditor\Core\BlockUtils;
use BetterBlockEditor\Core\ColorUtils;

defined( 'ABSPATH' ) || exit;

class Module extends ModuleBase implements ManagableModuleInterface {

	const MODULE_IDENTIFIER = 'pinned-block-styling';
	const ASSETS_BUILD_PATH = 'editor/blocks/__all__/pinned-block-styling/';

	const SETTINGS_ORDER = 1250;

	const ATTRIBUTES = 'dtCrPinnedStyling';

	public function setup_hooks() {
		add_filter( 'render_block', array( $this, 'render' ), 20, 3 );
	}

	function render( $block_content, $block ) {
		if ( $block_content === '' ) {
			return $block_content;
		}

		if ( 'sticky' !== ( $block['attrs']['style']['position']['type'] ?? null ) ) {
			return $block_content;
		}

		$settings = $block['attrs'][ self::ATTRIBUTES ] ?? array();
		if ( empty( $settings ) ) {
			return $block_content;
		}

		$block_content = BlockUtils::append_classes( $block_content, 'is-pin-ready' );

		$background_setting = $settings['background'] ?? array();
		if ( $background_setting['color'] ?? false ) {
			$background = ColorUtils::color_attribute_to_css( $background_setting['color'] );
		} elseif ( $background_setting['gradient'] ?? false ) {
			$background = ColorUtils::gradient_attribute_to_css( $background_setting['gradient'] );
		} else {
			$background = null;
		}

		$css_vars = array(
			'--wp-sticky--pinned-background'    => $background,
			'--wp-sticky--pinned-border-color'  => ColorUtils::color_attribute_to_css( $settings['borderColor'] ?? null ),
			'--wp-sticky--pinned-backdrop-blur' => $settings['backdropBlur'] ?? null,
			'--wp-sticky--pinned-shadow'        => $settings['shadow'] ?? null,
		);

		$css_classes = array(
			'background'    => 'has-pinned-background',
			'border-color'  => 'has-pinned-border',
			'backdrop-blur' => 'has-pinned-blur',
			'shadow'        => 'has-pinned-shadow',
		);
		// filter out classes without values in appropriate css variables
		$css_classes = array_filter(
			$css_classes,
			function ( $key ) use ( $css_vars ) {
				return null !== $css_vars[ '--wp-sticky--pinned-' . $key ];
			},
			ARRAY_FILTER_USE_KEY
		);

		return BlockUtils::append_classes(
			BlockUtils::append_inline_css_variables( $block_content, $css_vars ),
			$css_classes
		);
	}

	/**
	 * Set values from settings to JS variable
	 *
	 * @param string $key
	 */
	protected function enqueue_assets( $key ) {
		parent::enqueue_assets( $key );

		$settings = wp_get_global_settings();
		if ( $key === $this::EDITOR_ASSET_KEY ) {
			wp_add_inline_script(
				$this->build_script_handle( $key ),
				'const DT_CR_SHADOW_PRESETS=' . wp_json_encode(
					array( 'shadow' => $settings['shadow'] ?? array() )
				),
				'before'
			);
		}
	}

	public static function get_title() {
		return __( 'Styles on Scroll', 'bbe' );
	}

	public static function get_label() {
		return __( 'Add Styles on Scroll settings to Group, Row, Stack, and Grid blocks when Position is set to Sticky.', 'bbe' );
	}
}
