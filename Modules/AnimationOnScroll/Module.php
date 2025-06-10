<?php
/**
 * Adds Animation on Scroll settings to all blocks.
 *
 * @package BetterBlockEditor
 */

namespace BetterBlockEditor\Modules\AnimationOnScroll;

use BetterBlockEditor\Base\ModuleBase;
use BetterBlockEditor\Base\ManagableModuleInterface;
use BetterBlockEditor\Core\BlockUtils;

defined( 'ABSPATH' ) || exit;

class Module extends ModuleBase implements ManagableModuleInterface {

	const MODULE_IDENTIFIER        = 'animation-on-scroll';
	const ASSETS_BUILD_PATH        = 'editor/blocks/__all__/animation-on-scroll/';
	const PLUGIN_ASSETS_BUILD_PATH = 'editor/plugins/animation-on-scroll/';

	const SETTINGS_ORDER = 1000;

	const ATTRIBUTE_GROUP = 'dtCrAnimationOnScroll';

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

		// error_log(
		// 'Check: ' . $plugin_assets_full_path . $this::EDITOR_ASSET_KEY . '.css'
		// . ( file_exists( $plugin_assets_full_path . $this::EDITOR_ASSET_KEY . '.css' ) ? '1' : '0' )
		// );
		// $css_path_name =

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
		add_filter( 'render_block', array( $this, 'render' ), 20, 3 );
	}

	public function render( $block_content, $block ) {

		$animation_settings = $block['attrs'][ self::ATTRIBUTE_GROUP ] ?? null;

		if ( null === $animation_settings || $block_content === '' ) {
			return $block_content;
		}

		$data_attributes = array(
			'data-aos'        => $animation_settings['animation'] ?? null,
			'data-aos-easing' => $animation_settings['timingFunction'] ?? 'linear',
		);

		$css_variables = array(
			'--aos-duration' => ( intval( $animation_settings['duration'] ?? 0 ) / 1000 ) . 's',
			'--aos-delay'    => ( intval( $animation_settings['delay'] ?? 0 ) / 1000 ) . 's',
		);

		$tag = BlockUtils::get_tag_to_modify( $block_content );
		foreach ( $data_attributes as $key => $value ) {
			$tag->set_attribute( $key, $value );
		}
		foreach ( $css_variables as $key => $value ) {
			$tag->set_attribute( 'style', $tag->get_attribute( 'style' ) . '; ' . $key . ': ' . $value . ';' );
		}
		$block_content = $tag->get_updated_html();

		return $block_content;
	}


	public static function get_title() {
		return __( 'Animation on Scroll', 'bbe' );
	}

	public static function get_label() {
		return __( 'Add Animation on Scroll settings to all blocks.', 'bbe' );
	}
}
