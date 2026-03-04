import { configWithoutCloudSupport } from '@n8n/node-cli/eslint';
import prettier from 'eslint-plugin-prettier/recommended';

export default [...configWithoutCloudSupport, prettier];
