/**
 * Retrieves the block editor iframes present on the page.
 *
 * @return {Array} An array of iframes representing the block editor iframes.
 */
function getBlockEditorIframes() {
	const selectors = [
		// post editor / site-edit
		'iframe[name^="editor-canvas"]',

		// block editor block preview (left sidebar)
		'.block-editor-inserter__preview-container__popover .block-editor-inserter__preview .block-editor-block-preview__content iframe',

		// block editor pattern preview (left sidebar)
		// new post "Choose a pattern" modal
		'.block-editor-block-patterns-list .block-editor-block-preview__content iframe',

		// site editor patterns preview page
		'.edit-site-page-content .block-editor-block-preview__content iframe',
	];

	const blockPreviewIframes = Array.from( document.querySelectorAll( selectors.join( ',' ) ) );

	return blockPreviewIframes;
}

/**
 * Returns an array of Document objects representing the documents of the block editor iframes.
 * If no block editor iframes are found, an array containing the main document is returned.
 *
 * @return {Array<Document>} An array of Document objects representing the documents of the block editor iframes.
 */
export function getBlockEditorDocuments() {
	const blockeEdiorIframes = getBlockEditorIframes();

	return blockeEdiorIframes.length > 0
		? blockeEdiorIframes.map( ( iframe ) => iframe.contentWindow.document )
		: [ document ];
}
