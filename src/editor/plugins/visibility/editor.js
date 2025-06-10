import {
	getBlockEditorHeaderToolbar,
	getEditorDocument,
} from '@dt-cr/utils/editor-iframe-dom-utils';
import { Button, Tooltip } from '@wordpress/components';
import { subscribe, useDispatch, useSelect } from '@wordpress/data';
import domReady from '@wordpress/dom-ready';
import { createRoot, useCallback, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { seen, unseen } from '@wordpress/icons';
import { store as preferencesStore } from '@wordpress/preferences';
import './editor.scss';

export const PREFERENCE_NAME = 'dtCrVisibilityDisplayHelper';
export const CLASS_NAME = 'dt-cr-visibility-helper';

const VisibilityButton = () => {
	const isSelected = useSelect(
		( select ) => select( preferencesStore ).get( 'core', PREFERENCE_NAME ) ?? true,
		[]
	);

	const { set: setPreference } = useDispatch( preferencesStore );

	const updateBody = useCallback( () => {
		const body = getEditorDocument().getElementsByTagName( 'body' )[ 0 ];
		if ( body ) {
			if ( isSelected ) {
				body.classList.add( CLASS_NAME );
			} else {
				body.classList.remove( CLASS_NAME );
			}
		}
	}, [ isSelected ] );

	useEffect( () => {
		updateBody();
	}, [ isSelected, updateBody ] );

	window.onload = function () {
		setTimeout( () => {
			updateBody();
		}, 300 );
	};

	subscribe( () => {
		updateBody();
	} );

	let icon = unseen;
	let tooltipText = __( 'Reveal hidden blocks', 'bbe' );

	if ( isSelected ) {
		icon = seen;
		tooltipText = __( 'Conceal hidden blocks', 'bbe' );
	}

	return (
		<Tooltip text={ tooltipText }>
			<Button
				icon={ icon }
				aria-disabled="false"
				aria-label={ tooltipText }
				onClick={ () => {
					setPreference( 'core', PREFERENCE_NAME, ! isSelected );
				} }
			/>
		</Tooltip>
	);
};

domReady( () => {
	// Create Button
	const buttonDiv = document.createElement( 'div' );
	buttonDiv.classList.add( 'dt-cr-visibility-wrapper' );
	const root = createRoot( buttonDiv );

	root.render( <VisibilityButton /> );

	subscribe( () => {
		const toolbar = getBlockEditorHeaderToolbar();
		if ( toolbar ) {
			if ( ! toolbar.querySelector( '.dt-cr-visibility-wrapper' ) ) {
				toolbar.appendChild( buttonDiv );
			}
		}
	} );
} );
