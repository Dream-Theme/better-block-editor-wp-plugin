<?php
/**
 * Utility class for handling color and gradient attribute values in blocks.
 *
 * @package BetterBlockEditor
 */

namespace BetterBlockEditor\Core;

defined( 'ABSPATH' ) || exit;

class ColorUtils {

	/**
	 * Converts a color attribute value to a valid CSS color value.
	 *
	 * If the value is a hex color (starts with `#`), it is returned unchanged.
	 * Otherwise, it is assumed to be a preset color slug and is converted to a CSS variable.
	 *
	 * @param string $attribute_value The value of a color attribute.
	 *
	 * @return string A valid CSS color value.
	 */
	public static function color_attribute_to_css( $attribute_value ) {
		if ( ! $attribute_value ) {
			return $attribute_value;
		}

		return substr( $attribute_value, 0, 1 ) === '#'
			? $attribute_value
			: "var(--wp--preset--color--$attribute_value)";
	}


	/**
	 * Converts a gradient attribute value to a valid CSS gradient value.
	 *
	 * If the value starts with `linear-gradient` or `radial-gradient`, it is returned unchanged.
	 * Otherwise, it is assumed to be a preset gradient slug and is converted to a CSS variable.
	 *
	 * @param string $attribute_value The value of a gradient attribute.
	 *
	 * @return string A valid CSS gradient value.
	 */
	public static function gradient_attribute_to_css( $attribute_value ) {
		if ( ! $attribute_value ) {
			return $attribute_value;
		}

		return in_array( substr( $attribute_value, 0, 15 ), array( 'linear-gradient', 'radial-gradient' ) )
			? $attribute_value
			: "var(--wp--preset--gradient--$attribute_value)";
	}
}
