<?php
/**
 * Module for adding pinned block overlap to blocks
 *
 * @package BetterBlockEditor
 */

namespace BetterBlockEditor\Modules\PinnedBlockOverlap;

use BetterBlockEditor\Base\ManagableModuleInterface;
use BetterBlockEditor\Base\ModuleBase;
use BetterBlockEditor\Core\BlockUtils;

defined( 'ABSPATH' ) || exit;

class Module extends ModuleBase implements ManagableModuleInterface {

	const MODULE_IDENTIFIER = 'pinned-block-overlap';
	const ASSETS_BUILD_PATH = 'editor/blocks/__all__/pinned-block-overlap/';

	// this module is not manageable by user in free implementation
	const MANAGABLE_BY_USER = false;

	const SETTINGS_ORDER = 1300;

	const ATTRIBUTE_NAME = 'dtCrPinnedOverlap';

	// WP plugin check cries about heredoc, so we need to use a multi-line string
	const VIEW_JS = "
		function updateMargin(el) {
			const offset = '-' + el.getBoundingClientRect().height + 'px';
			el.style.setProperty('--wp--pinned-block-overlap', offset);
		}
		
		const resizeObserver = new ResizeObserver(
			(entries) => entries.forEach( (entry) => updateMargin(entry.target) )
		);

		window.wp.domReady( () => {
			document.querySelectorAll('.is-overlap-bottom, .is-overlap-top').forEach((el) => {
				// Update margin initially
				updateMargin(el);

				// observe with ResizeObserver to update the margin when the element's size changes
				resizeObserver.observe(el, {box: 'border-box'});
			});
		});

		document.querySelectorAll('.is-overlap-bottom, .is-overlap-top').forEach(( el ) => updateMargin( el ));
	";

	public function setup_hooks() {
		add_filter( 'render_block', array( $this, 'render' ), 20, 3 );
	}

	/**
	 * disabled for now according to the request from the Product Owner
	 */
	public static function get_default_state() {
		return false;
	}

	public function render( $block_content, $block ) {
		$overlap = $block['attrs'][ self::ATTRIBUTE_NAME ] ?? false;

		if ( ! $overlap || $block_content === '' ) {
			return $block_content;
		}

		return BlockUtils::append_classes( $block_content, array( 'is-overlap-' . $overlap ) );
	}

	protected function enqueue_assets( $key ) {
		parent::enqueue_assets( $key );

		// add as inline script to ensure that there is no blinking caused by loading delay
		if ( $key === $this::VIEW_ASSET_KEY ) {
			wp_add_inline_script( $this->build_script_handle( $key ), self::VIEW_JS, 'after' );
		}
	}

	public static function get_title() {
		return __( 'Overlap', 'bbe' );
	}

	public static function get_label() {
		return __( 'Add Overlap setting to Group, Row, Stack, and Grid blocks when Position is set to Sticky.', 'bbe' );
	}
}
