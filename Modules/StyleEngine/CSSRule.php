<?php
/**
 * Style Engine: WP_Style_Engine_CSS_Rule class
 *
 * @package    WordPress
 * @subpackage StyleEngine
 * @since      6.1.0
 */

namespace BetterBlockEditor\Modules\StyleEngine;

defined( 'ABSPATH' ) || exit;

/**
 * Core class used for style engine CSS rules.
 * Holds, sanitizes, processes, and prints CSS declarations for the style engine.
 *
 * @since 6.1.0
 */
#[AllowDynamicProperties]
class CSSRule {

	/**
	 * The selector.
	 *
	 * @since 6.1.0
	 * @var string
	 */
	protected $selector;

	/**
	 * The selector declarations.
	 * Contains a WP_Style_Engine_CSS_Declarations object.
	 *
	 * @since 6.1.0
	 * @var CSSDeclarations
	 */
	protected $declarations;

	/**
	 * Constructor.
	 *
	 * @param string                   $selector                      Optional. The CSS selector. Default empty string.
	 * @param string[]|CSSDeclarations $declarations                  Optional. An associative array of CSS definitions,
	 *                                                                e.g. `array( "$property" => "$value", "$property" => "$value" )`,
	 *                                                                or a WP_Style_Engine_CSS_Declarations object.
	 *                                                                Default empty array.
	 *
	 * @since 6.1.0
	 */
	public function __construct( $selector = '', $declarations = array() ) {
		$this->set_selector( $selector );
		$this->add_declarations( $declarations );
	}

	/**
	 * Sets the declarations.
	 *
	 * @param string[]|CSSDeclarations $declarations                  An array of declarations (property => value pairs),
	 *                                                                or a WP_Style_Engine_CSS_Declarations object.
	 *
	 * @return CSSRule Returns the object to allow chaining of methods.
	 * @since 6.1.0
	 */
	public function add_declarations( $declarations ) {
		$is_declarations_object = ! is_array( $declarations );
		$declarations_array     = $is_declarations_object ? $declarations->get_declarations() : $declarations;

		if ( null === $this->declarations ) {
			if ( $is_declarations_object ) {
				$this->declarations = $declarations;

				return $this;
			}
			$this->declarations = new CSSDeclarations( $declarations_array );
		}
		$this->declarations->add_declarations( $declarations_array );

		return $this;
	}

	/**
	 * Gets the declarations object.
	 *
	 * @return CSSDeclarations The declarations object.
	 * @since 6.1.0
	 */
	public function get_declarations() {
		return $this->declarations;
	}

	/**
	 * Gets the CSS.
	 *
	 * @param bool $should_prettify Optional. Whether to add spacing, new lines and indents.
	 *                              Default false.
	 * @param int  $indent_count    Optional. The number of tab indents to apply to the rule.
	 *                              Applies if `prettify` is `true`. Default 0.
	 *
	 * @return string
	 * @since 6.1.0
	 */
	public function get_css( $should_prettify = false, $indent_count = 0 ) {
		$rule_indent         = $should_prettify ? str_repeat( "\t", $indent_count ) : '';
		$declarations_indent = $should_prettify ? $indent_count + 1 : 0;
		$suffix              = $should_prettify ? "\n" : '';
		$spacer              = $should_prettify ? ' ' : '';
		$selector            = $should_prettify ? str_replace( ',', ",\n", $this->get_selector() ) : $this->get_selector();
		$css_declarations    = $this->declarations->get_declarations_string( $should_prettify, $declarations_indent );

		if ( empty( $css_declarations ) ) {
			return '';
		}

		return "{$rule_indent}{$selector}{$spacer}{{$suffix}{$css_declarations}{$suffix}{$rule_indent}}";
	}

	/**
	 * Gets the full selector.
	 *
	 * @return string
	 * @since 6.1.0
	 */
	public function get_selector() {
		return $this->selector;
	}

	/**
	 * Sets the selector.
	 *
	 * @param string $selector The CSS selector.
	 *
	 * @return CSSRule Returns the object to allow chaining of methods.
	 * @since 6.1.0
	 */
	public function set_selector( $selector ) {
		$this->selector = $selector;

		return $this;
	}
}
