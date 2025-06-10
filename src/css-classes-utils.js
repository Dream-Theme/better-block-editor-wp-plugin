import classNames from 'classnames';

function parseClassesString( classString ) {
	return classString
		.split( ' ' )
		.map( ( className ) => className.trim() )
		.filter( ( className ) => className !== '' );
}

export function addCssClasses( existingClasses = '', newClasses = '' ) {
	const existingClassesArray = parseClassesString( existingClasses );
	const newClassesArray = parseClassesString( newClasses );

	const allClasses = [
		...existingClassesArray,
		...newClassesArray.filter( ( className ) => ! existingClassesArray.includes( className ) ),
	];

	return classNames( allClasses );
}

export function removeCssClasses( existingClasses = '', excessiveClasses = '' ) {
	const existingClassesArray = parseClassesString( existingClasses );
	const excessiveClassesArray = parseClassesString( excessiveClasses );

	return classNames(
		existingClassesArray.filter(
			( className ) => ! excessiveClassesArray.includes( className )
		)
	);
}
