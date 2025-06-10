/**
 * Inspired by https://github.com/mciastek/sal
 */

import './common.scss';
import { INTERSECTION_OBSERVER_SETTINGS } from './constants';
/* eslint-disable object-shorthand */
/* eslint-disable no-console */
/* eslint-disable jsdoc/check-line-alignment */
/* eslint-disable no-var */

( function () {
	'use strict';

	/**
	 * AOS - Animation on Scroll Library
	 * Performance focused, lightweight scroll animation library
	 */

	var SSR_MESSAGE = 'AOS was not initialised! Probably it is used in SSR.';
	var NOT_SUPPORTED_MESSAGE =
		'' +
		'Your browser does not support IntersectionObserver!\n' +
		'Get a polyfill from here:\n' +
		'https://github.com/w3c/IntersectionObserver/tree/master/polyfill';

	/**
	 * Default options
	 */
	var options = {
		root: document,
		rootMargin: '0px 0px 0px 0px',
		threshold: 0,
		animateClassName: 'aos-animate',
		selector: '[data-aos]',
	};

	/**
	 * Private
	 */
	var elements = [];
	var intersectionObserver = null;

	/**
	 * Sets options.
	 * @param {Object} settings
	 */
	function setOptions( settings ) {
		if ( settings && settings !== options ) {
			options = Object.assign( {}, options, settings );
		}
	}

	/**
	 * Launches animation by adding class.
	 * @param {IntersectionObserverEntry} entry
	 */
	function animate( entry ) {
		entry.target.classList.add( options.animateClassName );
	}

	/**
	 * Checks if element was animated.
	 * @param {HTMLElement} element
	 */
	function isAnimated( element ) {
		return element.classList.contains( options.animateClassName );
	}

	/**
	 * IntersectionObserver callback.
	 * @param  {Array<IntersectionObserverEntry>} entries
	 * @param  {IntersectionObserver} observer
	 */
	function onIntersection( entries, observer ) {
		entries.forEach( function ( entry ) {
			var target = entry.target;

			if ( entry.intersectionRatio > options.threshold ) {
				animate( entry );
				observer.unobserve( target );
			}
		} );
	}

	/**
	 * Returns collection of elements and pushes them to observer.
	 *
	 * @return {Array<Node>} collection of elements to observe
	 */
	function getObservedElements() {
		var collection = [].filter.call(
			document.querySelectorAll( options.selector ),
			function ( element ) {
				return ! isAnimated( element );
			}
		);

		collection.forEach( function ( element ) {
			intersectionObserver.observe( element );
		} );

		return collection;
	}

	/**
	 * Init
	 * @param  {Object} settings
	 * @return {Object} public API
	 */
	function init( settings ) {
		if ( settings === void 0 ) {
			settings = options;
		}
		setOptions( settings );

		// Early return if window object is not defined (SSR)
		if ( typeof window === 'undefined' ) {
			console.warn( SSR_MESSAGE );
			return {
				elements: elements,
			};
		}

		// Check for IntersectionObserver support
		if ( ! ( 'IntersectionObserver' in window ) ) {
			throw new Error( NOT_SUPPORTED_MESSAGE );
		}

		intersectionObserver = new IntersectionObserver( onIntersection, {
			root: options.root,
			rootMargin: options.rootMargin,
			threshold: options.threshold,
		} );

		elements = getObservedElements();

		return {
			elements: elements,
		};
	}

	// Attach init to the global scope
	window.aos = init;
} )();

document.addEventListener( 'DOMContentLoaded', function () {
	window.aos( INTERSECTION_OBSERVER_SETTINGS );
} );
