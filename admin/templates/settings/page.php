<?php

use BetterBlockEditor\Core\Settings;

defined( 'ABSPATH' ) || exit; ?>

<div class="wrap">

	<h1><?php echo esc_html( __( 'Better Block Editor', 'bbe' ) ); ?></h1>

	<form action="options.php" method="post">
		<?php
		settings_fields( DT_CR_PLUGIN_ID . '_settings' );

		do_settings_sections( Settings::MENU_PAGE_SLUG );

		submit_button( esc_attr( __( 'Save Settings', 'bbe' ) ) );
		?>
	</form>

</div>
