/**
 * nodes/Commercetools/lambda/gcpHandler.js
 *
 * GCP Cloud Function (Gen2) handler that forwards Pub/Sub messages to the
 * n8n webhook URL.
 *
 * Environment variables (set at deploy time by gcpInfra.utils.ts):
 *   WEBHOOK_URL — n8n webhook URL to POST events to
 *
 * Event flow:
 *   commercetools → Pub/Sub topic → Cloud Function (this file) → n8n webhook
 *
 * This file is read from disk by gcpInfra.utils.ts and zipped into the
 * Cloud Function deployment package. Keeping it here as a real file (rather
 * than an embedded template string) makes it testable and reviewable in
 * isolation.
 *
 * Dependencies (package.json peer):
 *   @google-cloud/functions-framework ^3.0.0
 */

'use strict';

const functions = require('@google-cloud/functions-framework');
const https = require('https');
const http = require('http');

functions.cloudEvent('cloudFunctionCode', async (cloudEvent) => {
	const webhookUrl = process.env.WEBHOOK_URL;
	if (!webhookUrl) {
		console.error('FATAL: WEBHOOK_URL env var is not set');
		return;
	}

	const base64data = cloudEvent.data?.message?.data;
	if (!base64data) {
		console.warn('No Pub/Sub message data found in cloudEvent:', JSON.stringify(cloudEvent));
		return;
	}

	const decoded = Buffer.from(base64data, 'base64').toString('utf-8');
	console.log(JSON.stringify({ event: 'pubsub_received', size: decoded.length }));

	let parsed;
	try {
		parsed = JSON.parse(decoded);
	} catch {
		console.error('Pub/Sub message is not valid JSON:', decoded);
		return;
	}

	const body = JSON.stringify(parsed);
	const bodyBuffer = Buffer.from(body, 'utf-8');

	return new Promise((resolve, reject) => {
		const parsedUrl = new URL(webhookUrl);
		const client = parsedUrl.protocol === 'https:' ? https : http;

		const req = client.request(
			webhookUrl,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Content-Length': bodyBuffer.length,
				},
			},
			(res) => {
				let responseBody = '';
				res.setEncoding('utf-8');
				res.on('data', (chunk) => {
					responseBody += chunk;
				});
				res.on('end', () => {
					if (res.statusCode >= 200 && res.statusCode < 300) {
						console.log('Webhook delivered successfully, status:', res.statusCode);
						resolve();
					} else {
						console.error(
							'Webhook returned error status:',
							res.statusCode,
							'body:',
							responseBody,
						);
						reject(new Error('Webhook returned status ' + res.statusCode + ': ' + responseBody));
					}
				});
			},
		);

		req.on('error', (err) => {
			console.error('HTTP request to webhook failed:', err.message);
			reject(err);
		});

		req.write(bodyBuffer);
		req.end();
	});
});
