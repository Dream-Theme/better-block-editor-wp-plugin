<?php
/**
 * Plugin Name:       Better Block Editor
 * Description:       This plugin adds responsiveness settings to various blocks. It also introduces responsive visibility settings to all blocks, and more.
 * Requires at least: 6.8
 * Requires PHP:      7.2
 * Version:           0.3.0
 * Author:            Dream Theme
 * License:           GPLv2 or later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       bbe
 *
 * @package           BetterBlockEditor
 */

use BetterBlockEditor\Plugin;

defined( 'ABSPATH' ) || exit;

require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/plugin.php';

define( 'DT_CR_VERSION', '0.3.0' );

define( 'DT_CR_DIR', plugin_dir_path( __FILE__ ) );
define( 'DT_CR_BASE', plugin_basename( __FILE__ ) );
define( 'DT_CR_URL', plugins_url( '/', __FILE__ ) );
define( 'DT_CR_URL_DIST', DT_CR_URL . 'dist/' );
define( 'DT_CR_DIST', DT_CR_DIR . 'dist/' );
define( 'DT_CR_BLOCKS_DIR', DT_CR_DIST . 'blocks/' );
define( 'DT_CR_PLUGIN_ID', 'dt-cr' );
// register uninstall hook inside activate hook
// it has to be on this stage
register_activation_hook( __FILE__, 'dt_cr_plugin_activate' );

function dt_cr_plugin_activate() {
	register_uninstall_hook( __FILE__, array( 'BetterBlockEditor\Plugin', 'on_uninstall' ) );
}

Plugin::instance();
