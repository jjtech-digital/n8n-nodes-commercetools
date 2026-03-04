import { configWithoutCloudSupport } from '@n8n/node-cli/eslint';
import prettier from 'eslint-plugin-prettier/recommended';

export default [
	...configWithoutCloudSupport,
	prettier,
	{
		// Disable the rule for the entire node and scripts directories.
		files: ['nodes/Commercetools/generated/**/*.ts'],
		rules: {
			'import-x/no-unresolved': 'off',
		},
	},
];
