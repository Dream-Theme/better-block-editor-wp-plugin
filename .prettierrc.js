// Import the default config file and expose it in the project root.
// Useful for editor integrations.
const settings = require( '@wordpress/prettier-config' );
settings.printWidth = 100;
settings.endOfLine = 'auto';

module.exports = settings;
