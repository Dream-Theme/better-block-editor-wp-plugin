import { store as blockEditorStore } from '@wordpress/block-editor';
import { select, subscribe } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';

/**
 * Insert a node after element referenceNode is the node you want to put newNode after.
 * @param {*} referenceNode is the node you want to put newNode after.
 * @param {*} newNode       the node you want to insert
 */
export function insertAfter( referenceNode, newNode ) {
	if ( ! referenceNode || ! newNode ) {
		return;
	}
	referenceNode.parentNode.insertBefore( newNode, referenceNode.nextSibling );
}

/**
 * Insert a node before element referenceNode is the node you want to put newNode before.
 * @param {*} referenceNode is the node you want to put newNode before.
 * @param {*} newNode       the node you want to insert
 */
export function insertBefore( referenceNode, newNode ) {
	if ( ! referenceNode || ! newNode ) {
		return;
	}
	referenceNode.parentNode.insertBefore( newNode, referenceNode );
}

export function getEditorIframe() {
	return document.querySelector( 'iframe[name^="editor-canvas"]' );
}

/**
 * Returns the element that contains the blocks editor.
 *
 * @return {HTMLElement|null} The container element.
 */
export function getEditorContainerElement() {
	// order is important here so more specific selectors should go first
	const selectors = [
		// selector for 6.8
		'#editor .interface-interface-skeleton__editor .interface-navigable-region.interface-interface-skeleton__content .block-editor-block-canvas',
		// selector for 6.8.1
		'#editor .interface-interface-skeleton__editor .interface-navigable-region.interface-interface-skeleton__content',
	];

	for ( const selector of selectors ) {
		const element = document.querySelector( selector );
		if ( element ) {
			return element;
		}
	}

	return null;
}

export function getEditorDocument() {
	return getEditorIframe()?.contentWindow?.document ?? document;
}

// @see https://gist.github.com/KevinBatdorf/fca19e1f3b749b5c57db8158f4850eff
async function whenBlockEditorIsReady() {
	return new Promise( ( resolve ) => {
		const unsubscribe = subscribe( () => {
			// need to get it working for site editor and post editor
			if (
				select( editorStore ).isCleanNewPost() ||
				select( blockEditorStore ).getBlockCount() > 0
			) {
				unsubscribe();
				resolve();
			}
		} );
	} );
}

async function waitForBlockEditorRendered() {
	return new Promise( ( resolve ) => {
		const interval = setInterval( () => {
			// it's important to retrieve editor document every time here
			// otherwise it stays the same (empty one)
			getBlockEditorDocument().then( ( editorDocument ) => {
				const element = editorDocument.querySelector( '.wp-block[data-block]' );
				if ( ! isNaN( element?.getBoundingClientRect()?.height ) ) {
					clearInterval( interval );
					return resolve();
				}
			} );
		}, 100 );
	} );
}

async function getBlockEditorDocument() {
	const editorIframe = document.querySelector( 'iframe[name="editor-canvas"]' );

	if ( editorIframe ) {
		const editorIframeDocument = editorIframe.contentWindow.document;

		return new Promise( ( resolve ) => {
			if ( editorIframeDocument.readyState === 'complete' ) {
				// editors iframe has been already loaded (onload event won't be triggered)
				return resolve( editorIframeDocument );
			}

			editorIframe.contentWindow.addEventListener( 'load', () =>
				resolve( editorIframeDocument )
			);
		} );
	}

	// editor is not in iframe, return current document
	return new Promise( ( resolve ) => resolve( document ) );
}

/**
 * Async implementation of @wordpress/domReady
 * Waits for DOMContentLoaded event to be triggered.
 * If the event has already been triggered, the callback is called immediately.
 *
 * @param {Function} [callback] Callback function to be called when DOM is ready.
 * @return {Promise} Promise that resolves when DOM is ready.
 */
async function domReady( callback ) {
	if ( typeof document === 'undefined' ) {
		return;
	}

	return new Promise( ( resolve ) => {
		if (
			document.readyState === 'complete' || // DOMContentLoaded + Images/Styles/etc loaded, so we call directly.
			document.readyState === 'interactive' // DOMContentLoaded fires at this point, so we call directly.
		) {
			if ( callback ) {
				callback();
			}
			return resolve();
		}

		// DOMContentLoaded has not fired yet, delay callback until then.
		document.addEventListener( 'DOMContentLoaded', () => {
			if ( callback ) {
				callback();
			}
			resolve();
		} );
	} );
}

export async function blockEditorReady( callback ) {
	await domReady();

	await whenBlockEditorIsReady();

	await waitForBlockEditorRendered();

	callback();
}

/**
 * Retrieve the block editor header toolbar element.
 * Works for both block editor and site editor.
 *
 * @return {Element} The toolbar element.
 */
export function getBlockEditorHeaderToolbar() {
	return document.querySelector(
		':where(.block-editor, .edit-site) .editor-header .editor-header__settings'
	);
}

export function findOneInAllBlockEditors( selector ) {
	const selectors = [
		// post editor / site-edit
		'iframe[name^="editor-canvas"]',

		// block editor block preview (left sidebar)
		'.block-editor-inserter__preview-container__popover .block-editor-inserter__preview .block-editor-block-preview__content iframe',

		// block editor pattern preview (left sidebar)
		// new post "Choose a pattern" modal
		'.block-editor-block-patterns-list .block-editor-block-preview__content iframe',

		// templates list
		// site editor patterns preview page
		'.edit-site-page-content .block-editor-block-preview__content iframe',
	];

	const blockPreviewIframes = Array.from( document.querySelectorAll( selectors.join( ',' ) ) );

	for ( const iframe of blockPreviewIframes ) {
		const element = iframe.contentWindow.document.querySelector( selector );
		if ( element ) {
			return element;
		}
	}

	return undefined;
}
