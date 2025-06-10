import {
	__experimentalColorGradientSettingsDropdown as ColorGradientSettingsDropdown,
	__experimentalUseMultipleOriginColorsAndGradients as useColorsAndGradientsPalettes,
} from '@wordpress/block-editor';
import { BaseControl } from '@wordpress/components';
import './index.scss';

export default function ToolPanelColorsList( props ) {
	// get global settings and palettes for color and gradient
	const colorGradientSettings = useColorsAndGradientsPalettes();
	const {
		colors,
		disableCustomColors,
		gradients,
		disableCustomGradients,
		settings,
		panelId,
		label,
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
		<div className="tool-panel-colors-list__inner-wrapper">
			{ label && <BaseControl.VisualLabel as="legend">{ label }</BaseControl.VisualLabel> }
			<ColorGradientSettingsDropdown
				settings={ settings }
				panelId={ panelId }
				__experimentalIsRenderedInSidebar={ __experimentalIsRenderedInSidebar }
				{ ...{
					colors,
					disableCustomColors,
					gradients,
					disableCustomGradients,
					enableAlpha,
				} }
			/>
		</div>
	);
}
