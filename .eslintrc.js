const settings = {
	extends: [ 'eslint:recommended', 'plugin:@wordpress/eslint-plugin/recommended' ],
	globals: {
		jQuery: true,
		IntersectionObserver: true,
	},
	rules: {
		'prettier/prettier': 'warn',
		'@wordpress/no-unsafe-wp-apis': 'off',
		camelcase: [ 'error', { allow: [ '^dt-cr_' ] } ],
	},
	overrides: [
		{
			files: [ 'src/editor/**/dependencies/*' ],
			rules: {
				'prettier/prettier': 'off',
				'jsdoc/check-tag-names': 'off',
				'jsdoc/check-line-alignment': 'off',
			},
		},
	],
	settings: {
		'import/resolver': {
			webpack: {},
			node: {
				extensions: [ '.js', '.jsx', '.ts', '.tsx' ],
			},
		},
	},
};

module.exports = settings;
