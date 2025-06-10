<?php
/**
 * Module for Inline SVG block.
 *
 * @package BetterBlockEditor
 */

namespace BetterBlockEditor\Modules\InlineSVG;

use BetterBlockEditor\Core\BlockUtils;
use BetterBlockEditor\Core\ColorUtils;
use BetterBlockEditor\Modules\StyleEngine\Module as StyleEngineModule;
use BetterBlockEditor\Plugin;
use BetterBlockEditor\Base\ModuleBase;
use BetterBlockEditor\Base\ManagableModuleInterface;

defined( 'ABSPATH' ) || exit;

class Module extends ModuleBase {

	const MODULE_IDENTIFIER = 'inline-svg';

	public function init() {
		if ( ! Plugin::instance()->modules_manager->get_modules( \BetterBlockEditor\Modules\UploadSVG\Module::MODULE_IDENTIFIER ) ) {
			return;
		}
		register_block_type(
			DT_CR_BLOCKS_DIR . 'svg-inline',
			array(
				'render_callback' => array( $this, 'render' ),
			)
		);
	}


	public static function get_title() {
		return __( 'SVG Icon', 'bbe' );
	}

	public static function get_label() {
		return __( 'Allow to upload and display an SVG icon', 'bbe' );
	}

	public function render( $attributes, $content, $block ) {
		$imageID = $attributes['imageID'];

		if ( 'image/svg+xml' !== get_post_mime_type( $imageID ) ) {
			return '';
		}
		$image = get_attached_file( $imageID );
		if ( ! $svg_image_xml = file_get_contents( $image ) ) {
			return '';
		}

		$style = $attributes['style'] ?? array();

		$class_id = BlockUtils::create_unique_class_id();

		$options = array(
			'context'  => 'core',
			'prettify' => false,
			'selector' => ".{$class_id} .svg-wrapper",
		);
		// apply native styles
		$styles = StyleEngineModule::get_styles( $style, $options );

		$classes = array( 'dt-cr-svg-icon', $class_id );
		if ( ! empty( $styles['classnames'] ) ) {
			$classes[] = $styles['classnames'];
		}

		// prepare custom styles
		$style  = array();
		$colors = array(
			'color',
			'backgroundColor',
			'fillColor',
			'borderColor',
			'hoverColor',
			'hoverFillColor',
			'hoverBackgroundColor',
			'hoverBorderColor',
		);
		foreach ( $colors as $color ) {
			if ( array_key_exists( $color, $attributes ) ) {
				$style['color'][ $color ] = ColorUtils::color_attribute_to_css( $attributes[ $color ] );
			}
		}

		$dimensions = array( 'imageWidth' );
		foreach ( $dimensions as $dimension ) {
			if ( array_key_exists( $dimension, $attributes ) ) {
				$style['dimensions'][ $dimension ] = $attributes[ $dimension ];
			}
		}

		$alignment = $attributes['alignment'] ?? '';
		if ( ! empty( $alignment ) ) {
			$style['position']['alignment'] = $alignment;
		}

		$options['definitions_metadata'] = array(
			'color'      => array(
				'svgBackgroundColor' => array(
					'property_keys' => array( 'default' => 'background-color' ),
					'path'          => array(
						'color',
						'backgroundColor',
					),
					'css_vars'      => array( 'color' => '--wp--preset--color--$slug' ),
				),

				'svgBorderColor'     => array(
					'property_keys' => array( 'default' => 'border-color' ),
					'path'          => array(
						'color',
						'borderColor',
					),
					'classnames'    => array(
						'has-border-color' => true,
					),
					'css_vars'      => array( 'color' => '--wp--preset--color--$slug' ),
				),
			),
			'dimensions' => array(
				'width' => array(
					'property_keys' => array(
						'default' => '--svg-width',
					),
					'path'          => array( 'dimensions', 'imageWidth' ),
				),
			),
			'position'   => array(
				'height' => array(
					'property_keys' => array(
						'default' => '--svg-alignment',
					),
					'path'          => array( 'position', 'alignment' ),
				),
			),
		);

		$styles = StyleEngineModule::get_styles( $style, $options );
		if ( ! empty( $styles['classnames'] ) ) {
			$classes[] = $styles['classnames'];
		}

		$options['selector']             = ".{$class_id} svg";
		$options['definitions_metadata'] = array(
			'color' => array(
				'svgColor'       => array(
					'property_keys' => array( 'default' => 'color' ),
					'path'          => array(
						'color',
						'color',
					),
					'css_vars'      => array( 'color' => '--wp--preset--color--$slug' ),
				),
				'svgColorStroke' => array(
					'property_keys' => array( 'default' => 'stroke' ),
					'path'          => array(
						'color',
						'color',
					),
					'css_vars'      => array( 'color' => '--wp--preset--color--$slug' ),
				),
				'svgFillColor'   => array(
					'property_keys' => array( 'default' => 'fill' ),
					'path'          => array(
						'color',
						'fillColor',
					),
					'css_vars'      => array( 'fill' => '--wp--preset--color--$slug' ),
				),
			),
		);

		StyleEngineModule::get_styles( $style, $options );

		$options['selector']             = ".{$class_id} .svg-wrapper:hover";
		$options['definitions_metadata'] = array(
			'color' => array(
				'svgHoverBackgroundColor' => array(
					'property_keys' => array( 'default' => 'background-color' ),
					'path'          => array(
						'color',
						'hoverBackgroundColor',
					),
					'css_vars'      => array( 'color' => '--wp--preset--color--$slug' ),
				),
				'svgHoverBorderColor'     => array(
					'property_keys' => array( 'default' => 'border-color' ),
					'path'          => array(
						'color',
						'hoverBorderColor',
					),
					'classnames'    => array(
						'has-border-color' => true,
					),
					'css_vars'      => array( 'color' => '--wp--preset--color--$slug' ),
				),
			),
		);

		$styles = StyleEngineModule::get_styles( $style, $options );
		if ( ! empty( $styles['classnames'] ) ) {
			$classes[] = $styles['classnames'];
		}

		$options['selector']             = ".{$class_id} .svg-wrapper:hover svg";
		$options['definitions_metadata'] = array(
			'color' => array(
				'svgHoverColor'       => array(
					'property_keys' => array( 'default' => 'color' ),
					'path'          => array( 'color', 'hoverColor' ),
					'css_vars'      => array( 'color' => '--wp--preset--color--$slug' ),
				),
				'svgHoverStrokeColor' => array(
					'property_keys' => array( 'default' => 'stroke' ),
					'path'          => array( 'color', 'hoverColor' ),
					'css_vars'      => array( 'color' => '--wp--preset--color--$slug' ),
				),
				'svgHoverFillColor'   => array(
					'property_keys' => array( 'default' => 'fill' ),
					'path'          => array(
						'color',
						'hoverFillColor',
					),
					'css_vars'      => array( 'fill' => '--wp--preset--color--$slug' ),
				),
			),
		);

		StyleEngineModule::get_styles( $style, $options );

		$options['selector']             = ".{$class_id}";
		$options['definitions_metadata'] = array(
			'position' => array(
				'height' => array(
					'property_keys' => array(
						'default' => '--svg-alignment',
					),
					'path'          => array( 'position', 'alignment' ),
				),
			),
		);

		StyleEngineModule::get_styles( $style, $options );

		$href = $attributes['href'] ?? '';
		if ( ! empty( $href ) ) {
			$link_target = $attributes['linkTarget'] ?? '';
			$link_rel    = $attributes['rel'] ?? '';
		}
		ob_start();
		?>
		<div class="<?php echo esc_attr( implode( ' ', $classes ) ); ?>">
			<?php if ( ! empty( $href ) ) : ?>
				<a href="<?php echo esc_url( $href ); ?>"
					class="svg-wrapper svg-link"
					<?php echo ! empty( $link_target ) ? 'target="' . esc_attr( $link_target ) . '"' : ''; ?>
					<?php echo ! empty( $link_rel ) ? 'rel="' . esc_attr( $link_rel ) . '"' : ''; ?>
				>
					<?php echo $svg_image_xml; ?>
				</a>
			<?php else : ?>
				<div class="svg-wrapper">
					<?php echo $svg_image_xml; ?>
				</div>
			<?php endif; ?>
		</div>
		<?php
		return ob_get_clean();
	}
}
