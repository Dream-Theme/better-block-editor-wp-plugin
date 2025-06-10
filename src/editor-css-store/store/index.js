import reducer from './reducer';
import * as selectors from './selectors';
import * as actions from './actions';
import { createReduxStore, register } from '@wordpress/data';

export const STORE_NAME = 'dt-cr/block-editor';

export const storeConfig = {
	reducer,
	selectors,
	actions,
};

export const store = createReduxStore( STORE_NAME, {
	...storeConfig,
} );

register( store );
