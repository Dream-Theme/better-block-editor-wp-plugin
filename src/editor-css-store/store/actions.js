export function setStyle( scope, id, style ) {
	return {
		type: 'SET_STYLE',
		id,
		scope,
		style,
	};
}

export function deleteStyle( scope, id ) {
	return {
		type: 'DELETE_STYLE',
		id,
		scope,
	};
}
