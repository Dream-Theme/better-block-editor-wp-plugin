import { dispatch, select } from '@wordpress/data';
import { useCallback, useRef } from '@wordpress/element';
import { v4 as uuidv4 } from 'uuid';
import { EDITOR_DOCUMENT_ATTRIBUTE_NAME } from '../constants';
import { getBlockEditorDocuments } from '../editor-iframe-dom-utils';
import { store } from '../store';

const STYLE_ENGINE_STYLE_TAG_ID = 'dt-cr-style-sheet';

/**
 * Hook to add editor styles based on the provided CSS and identifier.
 *
 * @param {string | Array} styleCss   - The CSS styles to apply.
 * @param {string}         identifier - The identifier for the styles.
 *
 * @return {Function} A callback function used as ref for React component.
 */
export function useAddEditorStyle( styleCss, identifier ) {
	const { setStyle, deleteStyle } = dispatch( store );
	const scope = useRef( null );

	return useCallback(
		( node ) => {
			// cleanup
			if ( null === node ) {
				if ( scope.current ) {
					deleteStyle( scope.current, identifier );
				}

				return;
			}

			// if there is no attribute in document we create one
			if ( ! node.ownerDocument[ EDITOR_DOCUMENT_ATTRIBUTE_NAME ] ) {
				node.ownerDocument[ EDITOR_DOCUMENT_ATTRIBUTE_NAME ] = uuidv4();
			}

			scope.current = node.ownerDocument[ EDITOR_DOCUMENT_ATTRIBUTE_NAME ];

			// allow no new styles for this identifier (just remove old ones)
			if ( ! styleCss || ( Array.isArray( styleCss ) && styleCss.length === 0 ) ) {
				deleteStyle( scope.current, identifier );
			} else {
				const style = ! Array.isArray( styleCss ) ? [ styleCss ] : styleCss;
				setStyle( scope.current, identifier, style );
			}

			const styleRulesMap = select( store ).getStyles().get( scope.current ) || new Map();

			const styleRules = [];
			for ( const [ , value ] of styleRulesMap ) {
				if ( Array.isArray( value ) ) {
					styleRules.push( ...value );
				} else {
					styleRules.push( value );
				}
			}

			replaceStyleSheetContent( getStyleEngineStylesheet( scope.current ), styleRules );
		},
		[ deleteStyle, identifier, setStyle, styleCss ]
	);
}

/**
 * Replaces the content of a CSSStyleSheet with new style rules.
 *
 * @param {CSSStyleSheet} styleSheet    - The CSSStyleSheet to modify.
 * @param {Array<string>} newStyleRules - An array of strings representing the new style rules.
 *
 * @return {void}
 */
function replaceStyleSheetContent( styleSheet, newStyleRules ) {
	// eslint-disable-next-line no-undef
	if ( styleSheet?.constructor.name !== new CSSStyleSheet().constructor.name ) {
		return;
	}

	// remove old style rules
	for ( let i = 0; i < styleSheet.cssRules.length; i++ ) {
		styleSheet.deleteRule( i );
	}

	// and add new rules
	newStyleRules.forEach( ( rule ) => {
		styleSheet.insertRule( rule, styleSheet.cssRules.length );
	} );
}

/**
 * Retrieves the stylesheet for the given scope (using search by scope among available block editor documents).
 * Create new our own <style> tag in document head if it not exists yet
 *
 * @param {string} scope - The scope for which to retrieve the stylesheet.
 * @return {CSSStyleSheet} The stylesheet for the document with the given scope, or undefined if not found.
 */
function getStyleEngineStylesheet( scope ) {
	const targetDocument = getBlockEditorDocuments().find( ( el ) => {
		return el[ EDITOR_DOCUMENT_ATTRIBUTE_NAME ] === scope;
	} );

	if ( ! targetDocument ) {
		// eslint-disable-next-line no-console
		console.warn( 'DtCr-StyleEngine: No target document found for scope: ' + scope );
		return undefined;
	}

	for ( let i = 0; i < targetDocument.styleSheets.length; i++ ) {
		if ( targetDocument.styleSheets.item( i ).ownerNode.id === STYLE_ENGINE_STYLE_TAG_ID ) {
			return targetDocument.styleSheets.item( i );
		}
	}

	// create new style tag and add it to document head
	const styleElment = targetDocument.createElement( 'style' );
	styleElment.setAttribute( 'id', STYLE_ENGINE_STYLE_TAG_ID );
	targetDocument.head.append( styleElment );

	return styleElment.sheet;
}
