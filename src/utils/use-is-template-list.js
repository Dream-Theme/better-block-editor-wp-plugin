import { getEditorContainerElement, getEditorIframe } from './editor-iframe-dom-utils';

/**
 * To be used inside Block Editor hooks to check if we disply template list
 * Before counting iframes we need to check that it's not post/page editor
 * as in that case the same containers with iframes are used to display previews
 *
 * @return {boolean} True if current page is a template list.
 */
export function useIsTemplateList() {
	const targetDocument = window.top.document;
	if ( getEditorIframe() || getEditorContainerElement() ) {
		return false;
	}
	return (
		targetDocument.querySelectorAll( '.block-editor-block-preview__content iframe' ).length > 0
	);
}
