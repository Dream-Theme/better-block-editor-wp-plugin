import { __experimentalUseMultipleOriginColorsAndGradients as useMultipleOriginColorsAndGradients } from '@wordpress/block-editor';

export function useColorInputUtils() {
	const colorGradientSettings = useMultipleOriginColorsAndGradients();

	const paletteColors = [];
	( colorGradientSettings.colors ?? [] ).forEach( ( el ) => {
		( el.colors ?? [] ).forEach( ( color ) => paletteColors.push( color ) );
	} );

	function inputToAttribute( value ) {
		const paletteColor = paletteColors.find( ( el ) => el.color === value );

		return paletteColor ? paletteColor.slug : value;
	}

	function attributeToInput( value ) {
		const paletteColor = paletteColors.find( ( el ) => el.slug === value );
		return paletteColor ? paletteColor.color : value;
	}

	function attributeToCss( value ) {
		const paletteColor = paletteColors.find( ( el ) => el.slug === value );

		return paletteColor ? `var(--wp--preset--color--${ paletteColor.slug })` : value;
	}

	return { inputToAttribute, attributeToInput, attributeToCss };
}

export function useGradientInputUtils() {
	const colorGradientSettings = useMultipleOriginColorsAndGradients();

	const paletteGradients = [];
	( colorGradientSettings.gradients ?? [] ).forEach( ( el ) => {
		( el.gradients ?? [] ).forEach( ( gradient ) => paletteGradients.push( gradient ) );
	} );

	function inputToAttribute( value ) {
		const paletteGradient = paletteGradients.find( ( el ) => el.gradient === value );

		return paletteGradient ? paletteGradient.slug : value;
	}

	function attributeToInput( value ) {
		const paletteGradient = paletteGradients.find( ( el ) => el.slug === value );

		return paletteGradient ? paletteGradient.gradient : value;
	}

	function attributeToCss( value ) {
		const paletteGradient = paletteGradients.find( ( el ) => el.slug === value );

		return paletteGradient ? `var(--wp--preset--gradient--${ paletteGradient.slug })` : value;
	}

	return { inputToAttribute, attributeToInput, attributeToCss };
}
