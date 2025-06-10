<?php
/**
 * Adds custom formatting options to blocks.
 *
 * @package BetterBlockEditor
 */

namespace BetterBlockEditor\Modules\Format;

use BetterBlockEditor\Base\ModuleBase;
use BetterBlockEditor\Base\ManagableModuleInterface;

defined( 'ABSPATH' ) || exit;

class Module extends ModuleBase implements ManagableModuleInterface {

	const ASSETS_BUILD_PATH = 'editor/formatting/';
	const MODULE_IDENTIFIER = 'formatting';

	const SETTINGS_ORDER = 1050;

	public static function get_title() {
		return __( 'Block Formatting', 'bbe' );
	}

	public static function get_label() {
		return __( 'Add custom formatting to blocks', 'bbe' );
	}
}
