import { configWithoutCloudSupport } from '@n8n/node-cli/eslint';
import prettier from 'eslint-plugin-prettier/recommended';

export default [
    ...configWithoutCloudSupport,
    prettier,
    {
        // Generated files don't exist in the repo (they're produced by npm run generate).
        // Exclude them from import resolution checks so CI lint passes without
        // requiring a generate step before linting.
        rules: {
            'import-x/no-unresolved': [
                'error',
                {
                    ignore: ['\\.\/generated\\/'],
                },
            ],
        },
    },
];