<?php
/**
 * Utility class for handling block-related operations.
 *
 * @package BetterBlockEditor
 */

namespace BetterBlockEditor\Core;

use BetterBlockEditor\Modules\StyleEngine\Module as StyleEngineModule;
use WP_HTML_Tag_Processor;

defined( 'ABSPATH' ) || exit;

class BlockUtils {

	const BLOCK_UNIQUE_CLASSNAME_PREFIX = 'dt-cr-';


	static function create_unique_class_id(): string {
		return wp_unique_prefixed_id( self::BLOCK_UNIQUE_CLASSNAME_PREFIX );
	}
	static function get_unique_class_id( $block_content ): string {
		$prefix = self::BLOCK_UNIQUE_CLASSNAME_PREFIX;

		$tags = new WP_HTML_Tag_Processor( $block_content );
		if ( $tags->next_tag() ) {
			foreach ( $tags->class_list() as $class_name ) {
				$prefix_fine = $prefix === substr( $class_name, 0, strlen( $prefix ) );
				$sufix_fine  = preg_match( '/\d/', substr( $class_name, strlen( $prefix ) ) );
				if ( $prefix_fine && $sufix_fine ) {
					return $class_name;
				}
			}
		}

		return self::create_unique_class_id();
	}

	/**
	 * Appends classes to first tag of block content.
	 *
	 * @param string       $block_content The block content.
	 * @param array|string $content_classes The classes to add.
	 *
	 * @return string The modified block content.
	 */
	static function append_classes( $block_content, $content_classes ) {
		$tag = self::get_tag_to_modify( $block_content );
		if ( empty( $content_classes ) || ! $tag ) {
			return $block_content;
		}

		foreach ( (array) $content_classes as $class_name ) {
			$tag->add_class( $class_name );
		}

		return $tag->get_updated_html();
	}

	static function remove_classes( $block_content, $content_classes ) {
		$tag = self::get_tag_to_modify( $block_content );
		if ( empty( $content_classes ) || ! $tag ) {
			return $block_content;
		}

		foreach ( $content_classes as $class_name ) {
			$tag->remove_class( $class_name );
		}

		return $tag->get_updated_html();
	}

	static function get_tag_to_modify( $block_content ) {
		$p = new WP_HTML_Tag_Processor( $block_content );
		while ( $p->next_tag() ) {
			$tag_name = $p->get_tag();
			if ( $tag_name !== 'STYLE' && $tag_name !== 'SCRIPT' ) {
				return $p;
			}
		}

		return null;
	}

	/**
	 * Appends inline CSS styles to the first tag in the given block content.
	 *
	 * @param string $block_content   The HTML content of the block.
	 * @param array  $css_style_rules An associative array of CSS property-value pairs to be added.
	 *
	 * @return string The modified block content with appended inline styles.
	 */
	static function append_inline_styles( $block_content, $css_style_rules ) {
		$tag = self::get_tag_to_modify( $block_content );
		if ( empty( $css_style_rules ) || ! $tag ) {
			return $block_content;
		}

		foreach ( $css_style_rules as $property => $value ) {
			$tag->set_attribute( 'style', $tag->get_attribute( 'style' ) . '; ' . $property . ': ' . $value . ';' );
		}

		return $tag->get_updated_html();
	}

	static function append_inline_css_variables( $block_content, $css_variables ) {
		$tag = self::get_tag_to_modify( $block_content );
		if ( empty( $css_variables ) || ! $tag ) {
			return $block_content;
		}

		$var_string = '';
		foreach ( $css_variables as $name => $value ) {
			$var_string .= $name . ':' . $value . ';';
		}

		$tag->set_attribute( 'style', $tag->get_attribute( 'style' ) . '; ' . $var_string );

		return $tag->get_updated_html();
	}

	static function add_styles_from_css_rules( $css_rules ) {
		if ( ! empty( $css_rules ) ) {
			/*
			 * Add to the style engine store to enqueue and render layout styles.
			 * Return compiled layout styles to retain backwards compatibility.
			 * Since https://github.com/WordPress/gutenberg/pull/42452,
			 * wp_enqueue_block_support_styles is no longer called in this block supports file.
			 */
			return StyleEngineModule::get_stylesheet_from_css_rules(
				StyleEngineModule::preprocess_css_rules( $css_rules ),
				array(
					'context'  => 'core',
					'prettify' => false,
				)
			);
		}

		return '';
	}
}
