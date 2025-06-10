import { select } from '@wordpress/data';

export function extendWrapperPropsStyle( wrapperProps, style ) {
	wrapperProps = wrapperProps || {};
	if ( wrapperProps?.style ) {
		wrapperProps.style = {
			...wrapperProps.style,
			...style,
		};
	} else {
		wrapperProps.style = style;
	}

	return wrapperProps;
}

export function isBlockFullyEditable( clientId ) {
	return select( 'core/block-editor' ).getBlockEditingMode( clientId ) === 'default';
}
