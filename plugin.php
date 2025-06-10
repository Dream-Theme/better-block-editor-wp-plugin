<?php
/**
 * Main plugin class.
 *
 * @package BetterBlockEditor
 */

namespace BetterBlockEditor;

use BetterBlockEditor\Core\ModulesManager;
use BetterBlockEditor\Core\Settings;

defined( 'ABSPATH' ) || exit;

class Plugin {

	/**
	 * @var Plugin
	 */
	private static $_instance;

	/**
	 * @var ModulesManager
	 */
	public $modules_manager;

	/**
	 * Plugin constructor.
	 */
	private function __construct() {
		add_action( 'init', array( $this, 'on_init' ), 0 );

		// settings menu item and page.
		add_action( 'admin_init', array( Settings::class, 'settings_init' ) );
		add_action( 'admin_menu', array( Settings::class, 'settings_page' ) );

		// add link to settings page in plugins list.
		add_filter(
			'plugin_action_links_' . DT_CR_BASE,
			function ( $links ) {
				$url = admin_url( 'options-general.php?page=' . Settings::MENU_PAGE_SLUG );
				array_push( $links, '<a href="' . $url . '">' . esc_html( __( 'Settings', 'bbe' ) ) . '</a>' );

				return $links;
			}
		);
	}

	/**
	 * Singleton implementation
	 *
	 * @return self
	 */
	public static function instance() {
		if ( is_null( self::$_instance ) ) {
			self::$_instance = new self();

			do_action( 'bbe/loaded' );
		}

		return self::$_instance;
	}

	/**
	 * Uninstall hook.
	 *
	 * @return void
	 */
	public static function on_uninstall() {
		// This is a placeholder for any future uninstall logic.
	}

	public function on_init() {
		$this->modules_manager = new ModulesManager();
		$this->modules_manager->setup_hooks();
		do_action( 'bbe/init' );
	}

	/**
	 * Check if a feature (module) is active
	 *
	 * @param string $feature Feature identifier.
	 *
	 * @return bool
	 */
	public function is_feature_active( $feature ) {
		return (bool) $this->modules_manager->get_modules( $feature );
	}


	/**
	 * Get all features (modules)
	 *
	 * @return array
	 */
	public function get_active_features_keys() {
		$data = array();

		$modules = $this->modules_manager->get_modules();

		foreach ( $modules as $module ) {
			if ( $module::is_core_module() ) {
				continue;
			}
			$data[] = $module::get_identifier();
		}

		return $data;
	}


	/**
	 * Clone.
	 * Disable class cloning and throw an error on object clone.
	 * The whole idea of the singleton design pattern is that there is a single
	 * object. Therefore, we don't want the object to be cloned.
	 *
	 * @since  1.7.0
	 * @access public
	 */
	public function __clone() {
		_doing_it_wrong(
			__FUNCTION__,
			sprintf( 'Cloning instances of the singleton "%s" class is forbidden.', get_class( $this ) ), // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			'1.0.0'
		);
	}

	/**
	 * Wakeup.
	 * Disable unserializing of the class.
	 *
	 * @since  1.7.0
	 * @access public
	 */
	public function __wakeup() {
		_doing_it_wrong(
			__FUNCTION__,
			sprintf( 'Unserializing instances of the singleton "%s" class is forbidden.', get_class( $this ) ), // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			'1.0.0'
		);
	}
}
