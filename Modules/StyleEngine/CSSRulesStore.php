<?php
/**
 * Style Engine: WP_Style_Engine_CSS_Rules_Store class
 *
 * @package    WordPress
 * @subpackage StyleEngine
 * @since      6.1.0
 */

namespace BetterBlockEditor\Modules\StyleEngine;

defined( 'ABSPATH' ) || exit;

/**
 * Core class used as a store for WP_Style_Engine_CSS_Rule objects.
 * Holds, sanitizes, processes, and prints CSS declarations for the style engine.
 *
 * @since 6.1.0
 */
#[AllowDynamicProperties]
class CSSRulesStore {

	/**
	 * An array of named CSSRulesStore objects.
	 *
	 * @static
	 * @since 6.1.0
	 * @var CSSRulesStore[]
	 */
	protected static $stores = array();

	/**
	 * The store name.
	 *
	 * @since 6.1.0
	 * @var string
	 */
	protected $name = '';

	/**
	 * An array of CSS Rules objects assigned to the store.
	 *
	 * @since 6.1.0
	 * @var CSSRule[]
	 */
	protected $rules = array();

	/**
	 * Gets an instance of the store.
	 *
	 * @param string $store_name The name of the store.
	 *
	 * @return CSSRulesStore|void
	 * @since 6.1.0
	 */
	public static function get_store( $store_name = 'default' ) {
		if ( ! is_string( $store_name ) || empty( $store_name ) ) {
			return;
		}
		if ( ! isset( static::$stores[ $store_name ] ) ) {
			static::$stores[ $store_name ] = new static();
			// Set the store name.
			static::$stores[ $store_name ]->set_name( $store_name );
		}

		return static::$stores[ $store_name ];
	}

	/**
	 * Gets an array of all available stores.
	 *
	 * @return CSSRulesStore[]
	 * @since 6.1.0
	 */
	public static function get_stores() {
		return static::$stores;
	}

	/**
	 * Clears all stores from static::$stores.
	 *
	 * @since 6.1.0
	 */
	public static function remove_all_stores() {
		static::$stores = array();
	}

	/**
	 * Gets the store name.
	 *
	 * @return string
	 * @since 6.1.0
	 */
	public function get_name() {
		return $this->name;
	}

	/**
	 * Sets the store name.
	 *
	 * @param string $name The store name.
	 *
	 * @since 6.1.0
	 */
	public function set_name( $name ) {
		$this->name = $name;
	}

	/**
	 * Gets an array of all rules.
	 *
	 * @return CSSRule[]
	 * @since 6.1.0
	 */
	public function get_all_rules() {
		return $this->rules;
	}

	/**
	 * Gets a WP_Style_Engine_CSS_Rule object by its selector.
	 * If the rule does not exist, it will be created.
	 *
	 * @param string $selector The CSS selector.
	 *
	 * @return CSSRule|void Returns a WP_Style_Engine_CSS_Rule object,
	 *                                       or void if the selector is empty.
	 * @since 6.1.0
	 */
	public function add_rule( $selector ) {
		$selector = trim( $selector );

		// Bail early if there is no selector.
		if ( empty( $selector ) ) {
			return;
		}

		// Create the rule if it doesn't exist.
		if ( empty( $this->rules[ $selector ] ) ) {
			$this->rules[ $selector ] = new CSSRule( $selector );
		}

		return $this->rules[ $selector ];
	}

	/**
	 * Removes a selector from the store.
	 *
	 * @param string $selector The CSS selector.
	 *
	 * @since 6.1.0
	 */
	public function remove_rule( $selector ) {
		unset( $this->rules[ $selector ] );
	}
}
