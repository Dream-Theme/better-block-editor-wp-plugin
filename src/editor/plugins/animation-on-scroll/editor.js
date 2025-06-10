import { INTERSECTION_OBSERVER_SETTINGS } from '@dt-cr/editor/blocks/__all__/animation-on-scroll/constants';
import {
	blockEditorReady,
	getBlockEditorHeaderToolbar,
	getEditorDocument,
} from '@dt-cr/utils/editor-iframe-dom-utils';
import { Button, Dashicon, Tooltip } from '@wordpress/components';
import { createRoot } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import 'url-change-event';
import './editor.scss';

let intersectionObserver = null;

function resetAnimation() {
	const blockEditorDocument = getEditorDocument();
	intersectionObserver.disconnect();

	// add elements again to observer
	blockEditorDocument.querySelectorAll( '[data-aos]' ).forEach( ( el ) => {
		el.classList.remove( 'aos-animate' );
		intersectionObserver.observe( el );
	} );
}

function addPlayAnimationButton() {
	// create reset animation button and add it to the toolbar
	const toolbar = getBlockEditorHeaderToolbar();
	if ( toolbar && ! toolbar.querySelector( '.dt-cr-animation-reset-wrapper' ) ) {
		toolbar.appendChild( withWrapper( AnimationResetButton, 'dt-cr-animation-reset-wrapper' ) );
	}

	const blockEditorDocument = getEditorDocument();

	// initialize intersection observer
	intersectionObserver = new IntersectionObserver(
		( entries, observer ) => {
			entries.forEach( ( entry ) => {
				if ( entry.intersectionRatio > 0 ) {
					entry.target.classList.add( 'aos-animate' );
					observer.unobserve( entry.target );
				}
			} );
		},
		{
			...INTERSECTION_OBSERVER_SETTINGS,
			root: blockEditorDocument,
		}
	);
}

const AnimationResetButton = () => {
	const tooltipText = __( 'Play animation', 'bbe' );

	return (
		<Tooltip text={ tooltipText }>
			<Button
				icon={ <Dashicon icon="controls-play" /> }
				aria-disabled="false"
				aria-label={ tooltipText }
				onClick={ () => resetAnimation() }
			/>
		</Tooltip>
	);
};

function withWrapper( Component, wrapperClassname ) {
	const wrapper = document.createElement( 'div' );
	wrapper.classList.add( wrapperClassname );

	const root = createRoot( wrapper );
	root.render( <Component /> );

	return wrapper;
}

// we need this reinitialization to handle switch between templates
// ( Appearence->Editor->Templates ) as there is no page reload during this process
window.addEventListener( 'urlchangeevent', () => {
	blockEditorReady( addPlayAnimationButton );
} );

// init on page load
blockEditorReady( addPlayAnimationButton );
