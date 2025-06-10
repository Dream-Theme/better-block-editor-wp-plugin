import { blockEditorReady } from '@dt-cr/utils/editor-iframe-dom-utils';
import { createRoot } from '@wordpress/element';
import './editor.scss';
import './order-panels.scss';

function Copyright() {
	return <span>© Better Block Editor</span>;
}

function withWrapper( Component, wrapperClassname ) {
	const wrapper = document.createElement( 'div' );
	wrapper.classList.add( wrapperClassname );

	const root = createRoot( wrapper );
	root.render( <Component /> );

	return wrapper;
}

function addCopyright() {
	// create reset animation button and add it to the toolbar
	const editorFooter =
		// page/post editor
		document.querySelector( '#editor .interface-interface-skeleton__footer' ) ||
		// site editor
		document.querySelector( '#site-editor .interface-interface-skeleton__footer' );

	if ( editorFooter && ! editorFooter.querySelector( '.dt-cr-copyright' ) ) {
		editorFooter.appendChild( withWrapper( Copyright, 'dt-cr-copyright' ) );
	}
}

// we need this reinitialization to handle switch between templates
// ( Appearence->Editor->Templates ) as there is no page reload during this process
window.addEventListener( 'urlchangeevent', () => {
	blockEditorReady( () => addCopyright() );
} );

// initial call to add the copyright
blockEditorReady( () => addCopyright() );
