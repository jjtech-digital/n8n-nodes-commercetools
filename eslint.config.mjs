import { configWithoutCloudSupport } from '@n8n/node-cli/eslint';
import prettier from 'eslint-plugin-prettier/recommended';

export default [
	...configWithoutCloudSupport,
	prettier,
	{
		ignores: ['nodes/Commercetools/generated/**'],
	},
	{
		files: ['nodes/Commercetools/**/*.ts', 'scripts/**/*.ts'],
		rules: {
			'import-x/no-unresolved': 'off',
			'no-console': ['error', { allow: ['warn', 'error'] }],
		},
	},
];
