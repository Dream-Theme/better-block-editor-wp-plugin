export const FEATURE_NAME = 'blocks__core_row__responsiveness';

export const JUSTIFICATION_VALUES = {
	LEFT: 'left',
	RIGHT: 'right',
	CENTER: 'center',
	SPACE_BETWEEN: 'space-between',
	STRETCH: 'stretch',
};

export const VERTICAL_ALIGNMENT_VALUES = {
	TOP: 'top',
	MIDDLE: 'center',
	BOTTOM: 'bottom',
	STRETCH: 'stretch',
	SPACE_BETWEEN: 'space-between',
};

export const ORIENTATION_VALUES = {
	ROW: 'row',
	ROW_REVERSE: 'row-reverse',
	COLUMN: 'column',
	COLUMN_REVERSE: 'column-reverse',
};

export function isOrientationHorizontal( orientation ) {
	return [ ORIENTATION_VALUES.ROW, ORIENTATION_VALUES.ROW_REVERSE ].includes( orientation );
}

export function isOrientationVertical( orientation ) {
	return [ ORIENTATION_VALUES.COLUMN, ORIENTATION_VALUES.COLUMN_REVERSE ].includes( orientation );
}

export function isOrientationReverse( orientation ) {
	return [ ORIENTATION_VALUES.ROW_REVERSE, ORIENTATION_VALUES.COLUMN_REVERSE ].includes(
		orientation
	);
}
