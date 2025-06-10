// @ts-nocheck
// DT_CR_RESPONSIVE_BREAKPOINT_SETTINGS is defined in the PHP code

/**
 * There is no full support of JS modules in WP, so do a trick to avoid polluting the global scope.
 * This is a self-invoking function that will run immediately and will not expose any variables to the global scope.
 * It will only expose the `dtCrSettingsAddBreakpoint` function to the global scope.
 */
( () => {
	const HTML_WRAPPER_ID = 'user-defined-breakpoint-list';

	const {
		BREAKPOINT_LIST = new Map(),
		ALLOWED_SIZE_UNITS = [],
		WP_OPTION_NAME = '',
		I18N_TRANSLATIONS = {},
	} =
		// eslint-disable-next-line  no-undef
		DT_CR_RESPONSIVE_BREAKPOINT_SETTINGS;

	function dtCrSettingsGetTemplate( identifier, option ) {
		const key = identifier || window.crypto.getRandomValues( new Uint32Array( 3 ) ).join( '-' );
		const name = option?.name || '';
		const value = option?.value || null;
		const unit = option?.unit || 'px';

		const unitSelect =
			`<select name="${ WP_OPTION_NAME }[${ key }][unit]">` +
			ALLOWED_SIZE_UNITS.map(
				( el ) =>
					`<option value="${ el }" ${ el === unit ? 'selected' : '' }>${ el }</option>`
			).join( '\n' ) +
			'</select>';

		const removeButton = [ 'tablet', 'mobile' ].includes( key )
			? ''
			: `<span 
				class="dashicons dashicons-trash" 
				onclick="
					if (window.confirm('${ I18N_TRANSLATIONS.remove_breakpoint_confirm_message }')) {
						this.parentNode.remove();
					}
					return false;
				"; 
				style="width: auto; height: auto; line-height: inherit; font-size: 1.5em; vertical-align: middle; cursor: pointer;"
				title="${ I18N_TRANSLATIONS.remove_breakpoint_button_title }"
			/>`;

		return `
		<div class="user-defined-breakpoint item" style="margin-bottom: .5em;">
			<input 
				name="${ WP_OPTION_NAME }[${ key }][name]" 
				required
				type="text" 
				value="${ name }" 
				size="15"
				maxlength="20"
			/>

			<input 
				name="${ WP_OPTION_NAME }[${ key }][value]" 
				required
				type="number"
				min="0" 
				step="1"
				max="9999" 
				class="small-text"
				value="${ value }" 
			/>
			
			${ unitSelect }

			${ removeButton }
		</div>
		`;
	}
	// export the function to the global scope
	window.dtCrSettingsAddBreakpoint = function ( event ) {
		event.stopPropagation();
		event.preventDefault();
		document
			.getElementById( HTML_WRAPPER_ID )
			?.insertAdjacentHTML( 'beforeend', dtCrSettingsGetTemplate() );
	};

	// show current active breakpoints
	BREAKPOINT_LIST.forEach( ( option, key ) => {
		document.getElementById( HTML_WRAPPER_ID )?.insertAdjacentHTML(
			'beforeend',
			dtCrSettingsGetTemplate( key, {
				name: option.name,
				value: option.value,
				unit: option.unit,
			} )
		);
	} );
} )();
