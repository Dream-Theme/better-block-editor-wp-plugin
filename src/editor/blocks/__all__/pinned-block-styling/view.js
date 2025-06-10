import domReady from '@wordpress/dom-ready';
import './common.scss';
import { createSentinelObserver, createTopSentinel } from './sentinel';

domReady( () => {
	const pinReadyElements = document.querySelectorAll( '.is-pin-ready' );

	// early return if there is no elements to process
	if ( ! pinReadyElements.length ) {
		return;
	}

	function getAdminBarHeight() {
		// read admin bar position offset from css variable of sticked element
		// it's added by WP core to "compensate" sticky admin bar in FE
		// we handle also situation when there is no admin panel in FE (plain user)
		return parseInt(
			window
				.getComputedStyle(
					document.querySelector( '.is-position-sticky' ) ?? document.body
				)
				.getPropertyValue( '--wp-admin--admin-bar--position-offset' ) || '0'
		);
	}

	// Cache pinned state for elements
	const elementStates = new Map();

	// Global scroll state
	let isScrolled = false;

	// to detect window scroll use sentinel + IntersectionObserver
	// create top sentinel dynamically (1x1 pixel) and append to body (very first element)
	const topSentinel = createTopSentinel();

	document.body.prepend( topSentinel );

	// Observe for top sentinel to detect scroll
	const scrollObserver = createSentinelObserver( document, ( entry ) => {
		isScrolled = ! entry.isIntersecting;
		updatePinnedClasses();
	} );
	scrollObserver.observe( topSentinel );

	// Update pinned classes based on values in elementStates
	function updatePinnedClasses() {
		elementStates.forEach( ( shouldPin, el ) => {
			if ( shouldPin && isScrolled ) {
				el.classList.add( 'is-pinned' );
			} else {
				el.classList.remove( 'is-pinned' );
			}
		} );
	}

	// Observer to detect sticky positions
	function initPinReadyHandler() {
		const adminBarHeight = getAdminBarHeight();

		const stickyObserver = new IntersectionObserver(
			( entries ) => {
				entries.forEach( ( entry ) => {
					const shouldPin = entry.boundingClientRect.top < adminBarHeight + 1;
					elementStates.set( entry.target, shouldPin );
				} );
				updatePinnedClasses();
			},
			{
				root: document,
				threshold: [ 1 ],
				rootMargin: `${ -( adminBarHeight + 1 ) }px 0px 0px 0px`,
			}
		);

		pinReadyElements.forEach( ( el ) => {
			stickyObserver.observe( el );
			// initially not pinned
			elementStates.set( el, false );
		} );
	}

	// after resize height of admin bar can change, implement throttled update
	let timeout = null;
	window.addEventListener( 'resize', () => {
		clearTimeout( timeout );
		timeout = setTimeout( initPinReadyHandler, 50 );
	} );

	// Initial run to set correct state
	initPinReadyHandler();
} );
