import { combineReducers } from '@wordpress/data';

const combinedReducers = combineReducers( {
	styles,
} );

/**
 * Reducer returning a map of style IDs to style overrides.
 *
 * @param {Map}    state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Map} Updated state.
 */
export function styles( state = new Map(), action ) {
	const newState = new Map( state );
	switch ( action.type ) {
		case 'SET_STYLE':
			if ( ! newState.has( action.scope ) ) {
				newState.set( action.scope, new Map() );
			}
			newState.get( action.scope ).set( action.id, action.style );
			return newState;
		case 'DELETE_STYLE': {
			if ( newState.has( action.scope ) ) {
				newState.get( action.scope ).delete( action.id );
			}
			return newState;
		}
	}
	return state;
}

export default combinedReducers;
