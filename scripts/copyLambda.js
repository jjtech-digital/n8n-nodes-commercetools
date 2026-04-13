/**
 * scripts/copyLambda.js
 *
 * Cross-platform postbuild script to copy lambda/*.js handler files
 * into dist/ — replaces Unix-only `mkdir -p && cp` shell commands.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'nodes', 'Commercetools', 'lambda');
const dst = path.join(__dirname, '..', 'dist', 'nodes', 'Commercetools', 'lambda');

fs.mkdirSync(dst, { recursive: true });

const copied = fs
	.readdirSync(src)
	.filter((f) => f.endsWith('.js'))
	.map((f) => {
		fs.copyFileSync(path.join(src, f), path.join(dst, f));
		return f;
	});

console.log(`[postbuild] Copied lambda files to dist: ${copied.join(', ')}`);
