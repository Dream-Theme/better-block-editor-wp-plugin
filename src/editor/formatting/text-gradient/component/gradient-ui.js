import { Popover } from '@wordpress/components';
import { applyFormat, removeFormat, getActiveFormat, useAnchor } from '@wordpress/rich-text';
import { textGradient } from '@dt-cr/editor/formatting/text-gradient';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';
import {
	store as blockEditorStore,
	__experimentalColorGradientControl as ColorGradientControl,
	__experimentalUseMultipleOriginColorsAndGradients as useColorsAndGradientsPalettes,
} from '@wordpress/block-editor';
import { useGradientInputUtils } from '@dt-cr/hooks/use-color-input-utils';

function ColorGradientSettings( props ) {
	const colorGradientSettings = useColorsAndGradientsPalettes();
	const {
		colors,
		disableCustomColors,
		gradients,
		disableCustomGradients,
		settings,
		enableAlpha,
		__experimentalIsRenderedInSidebar,
	} = {
		...colorGradientSettings,
		...props,
	};

	// this condition is copied from
	// @wordpress/block-editor/src/components/colors-gradients/panel-color-gradient-settings.js
	if (
		( ! colors || colors.length === 0 ) &&
		( ! gradients || gradients.length === 0 ) &&
		disableCustomColors &&
		disableCustomGradients &&
		settings?.every(
			( setting ) =>
				( ! setting.colors || setting.colors.length === 0 ) &&
				( ! setting.gradients || setting.gradients.length === 0 ) &&
				( setting.disableCustomColors === undefined || setting.disableCustomColors ) &&
				( setting.disableCustomGradients === undefined || setting.disableCustomGradients )
		)
	) {
		return null;
	}
	return (
		<>
			{ settings.map( ( setting, index ) => {
				const controlProps = {
					clearable: false,
					colorValue: setting.colorValue,
					colors,
					disableCustomColors,
					disableCustomGradients,
					enableAlpha,
					gradientValue: setting.gradientValue,
					gradients,
					label: setting.label,
					onColorChange: setting.onColorChange,
					onGradientChange: setting.onGradientChange,
					showTitle: false,
					__experimentalIsRenderedInSidebar,
					...setting,
				};

				return (
					setting && (
						<div
							key={ index }
							className="block-editor-panel-color-gradient-settings__dropdown-content"
						>
							<ColorGradientControl { ...controlProps } />
						</div>
					)
				);
			} ) }
		</>
	);
}

function CustomGradientPicker( { name, property, value, onChange } ) {
	const colors = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		return getSettings().colors ?? [];
	}, [] );
	const activeColors = useMemo(
		() => getActiveColors( value, name, colors ),
		[ name, value, colors ]
	);

	const {
		attributeToInput: gradientAttributeToInput,
		inputToAttribute: gradientInputToAttribute,
		attributeToCss: gradientAttributeToCss,
	} = useGradientInputUtils();
	return (
		<ColorGradientSettings
			settings={ [
				{
					label: __( 'Gradient', 'bbe' ),
					enableAlpha: true,
					clearable: true,
					gradientValue: gradientAttributeToInput( activeColors[ property ] ),
					onGradientChange: ( color ) => {
						onChange(
							setColors( value, name, colors, {
								[ property ]: gradientAttributeToCss(
									gradientInputToAttribute( color )
								),
							} )
						);
					},
				},
			] }
		/>
	);
}

function parseCSS( css = '' ) {
	return css.split( ';' ).reduce( ( accumulator, rule ) => {
		if ( rule ) {
			const [ property, value ] = rule.split( ':' );
			if ( property === 'background-image' ) {
				accumulator.gradientColor = value;
			}
		}
		return accumulator;
	}, {} );
}

export function getActiveColors( value, name ) {
	const activeColorFormat = getActiveFormat( value, name );

	if ( ! activeColorFormat ) {
		return {};
	}

	return {
		...parseCSS( activeColorFormat.attributes.style ),
	};
}

function setColors( value, name, colorSettings, colors ) {
	const { gradientColor } = {
		...getActiveColors( value, name, colorSettings ),
		...colors,
	};

	if ( ! gradientColor ) {
		return removeFormat( value, name );
	}

	const styles = [];
	const attributes = {};

	if ( gradientColor ) {
		styles.push( [ 'background-image', gradientColor ].join( ':' ) );
	}

	if ( styles.length ) {
		attributes.style = styles.join( ';' );
	}

	return applyFormat( value, { type: name, attributes } );
}

export default function GradientUI( { name, value, onChange, onClose, contentRef, isActive } ) {
	const popoverAnchor = useAnchor( {
		editableContentElement: contentRef.current,
		settings: { ...textGradient, isActive },
	} );
	return (
		<Popover
			onClose={ onClose }
			className="format-library__inline-color-dt-cr-gradient"
			anchor={ popoverAnchor }
		>
			<CustomGradientPicker
				name={ name }
				property={ 'gradientColor' }
				value={ value }
				onChange={ onChange }
			/>
		</Popover>
	);
}
