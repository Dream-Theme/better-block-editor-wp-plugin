const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );
const DependencyExtractionWebpackPlugin = require( '@wordpress/dependency-extraction-webpack-plugin' );
const { resolve } = require( 'path' );
const path = require( 'path' );
const glob = require( 'glob' );

function buildEditorBlockEntries() {
	let returnValue = {};
	[
		'editor/blocks/*/*/editor.js',
		'editor/blocks/*/*/editor-content.js',
		'editor/blocks/*/*/view.js',
		'editor/blocks/*/*/common.js',
		'editor/plugins/*/editor.js',
		'editor/formatting/editor.js',
		'editor/formatting/common.js',
	].forEach( ( pattern ) => {
		returnValue = {
			...returnValue,
			...glob
				.sync( pattern, {
					cwd: path.resolve( __dirname, 'src' ),
				} )
				// fix to work properly with windows FS
				.reduce( function ( obj, el ) {
					const entryName =
						path.dirname( el ).replace( /\\/g, '/' ) + '/' + path.parse( el ).name;
					obj[ entryName ] = `./src/${ el.replace( /\\/g, '/' ) }`;
					return obj;
				}, {} ),
		};
	} );

	return returnValue;
}

const settings = {
	...defaultConfig,
	entry: {
		// new editor blocks (see ./src/blocks/*)
		...defaultConfig.entry(),

		// our changes to core blocks (see ./src/editor/blocks/*)
		...buildEditorBlockEntries(),

		// shared libraries
		'editor/editor-css-store/index': {
			import: './src/editor-css-store',
			library: {
				name: [ 'dt-cr', 'editor-css-store' ],
				type: 'window',
			},
		},
	},

	output: {
		filename: '[name].js',
		path: resolve( process.cwd(), 'dist' ),
	},

	externals: {
		'dt-cr/editor-css-store': [ 'dt-cr', 'editor-css-store' ],
	},

	resolve: {
		extensions: [ '.js' ],
		alias: {
			'dt-cr/editor-css-store': path.resolve( __dirname, 'src/editor-css-store' ),
			'@dt-cr': path.resolve( __dirname, './src/' ),
		},
	},

	watchOptions: {
		ignored: [ '**/node_modules/**', '**/vendor/**', '**/.git/**', '**/dist/**' ],
	},
};

// to configure DependencyExtractionWebpackPlugin we havo to replace the old one
// see (https://www.npmjs.com/package/@wordpress/dependency-extraction-webpack-plugin?activeTab=readme#usage)

const pluginDependencyExtractionOptions =
	settings.plugins.find(
		( plugin ) => plugin.constructor.name === 'DependencyExtractionWebpackPlugin'
	)?.options ?? {};

// @ts-ignore
settings.plugins = [
	...settings.plugins.filter(
		( plugin ) => plugin.constructor.name !== 'DependencyExtractionWebpackPlugin'
	),

	new DependencyExtractionWebpackPlugin( {
		...pluginDependencyExtractionOptions,
		requestToHandle: ( request ) => {
			if ( request === 'dt-cr/editor-css-store' ) {
				return 'dt-cr-editor-css-store';
			}
		},
		requestToExternal: ( request ) => {
			if ( request === 'dt-cr/editor-css-store' ) {
				return [ 'dt-cr', 'editor-css-store' ];
			}
		},
	} ),
];

module.exports = settings;
