<?php
/**
 * Interface for all modules in BetterBlockEditor plugin.
 *
 * @package BetterBlockEditor
 */

namespace BetterBlockEditor\Base;

defined( 'ABSPATH' ) || exit;

interface ModuleInterface {
	/**
	 * Module identifier to be used internally by system.
	 */
	public static function get_identifier();

	/**
	 * Core modules provide core functionality used by other modules, initialized first and can not be disabled.
	 */
	public static function is_core_module();

	/**
	 * Set up hooks for the module.
	 */
	public function setup_hooks();

	/**
	 * Actions preformed when module is initialized.
	 */
	public function init();
}
