/**
 * Values are provided in Settings Module (PHP) as they are populated from DB.
 * Need this to be global var to be able to access it from different blocks.
 */
// eslint-disable-next-line no-var, no-unused-vars

const DT_CR_DATA = window.DT_CR_DATA || {};

/**
 * Check if a feature is active.
 *
 * @param {string} featureKey The feature key to check.
 * @return {boolean} True if the feature is active, false otherwise.
 */
export function isFeatureActive( featureKey ) {
	const features = DT_CR_DATA?.features || [];
	return features.includes( featureKey );
}

/**
 * Get all user-defined responsive breakpoints.
 *
 * @return {Array} Array of breakpoint objects with keys: key, name, value, active.
 */
export function getUserBreakpoints() {
	return DT_CR_DATA?.breakpoints || [];
}
