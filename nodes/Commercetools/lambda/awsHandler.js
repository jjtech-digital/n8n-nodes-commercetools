/**
 * nodes/Commercetools/lambda/awsHandler.js
 *
 * AWS Lambda handler that forwards SQS messages to the n8n webhook URL.
 *
 * Environment variables (set at deploy time by awsInfra.utils.ts):
 *   WEBHOOK_URL     — n8n webhook URL to POST events to
 *   CTP_PROJECT_KEY — commercetools project key (informational, included in payload)
 *   EVENT_TYPE      — primary event type this Lambda is processing
 *   QUEUE_NAME      — SQS queue name (informational)
 *
 * This file is read from disk by awsInfra.utils.ts and zipped into the
 * Lambda deployment package. Keeping it here as a real file (rather than
 * an embedded template string) makes it testable and reviewable in isolation.
 */

'use strict';

const https = require('https');
const http = require('http');

/**
 * POST `payload` as JSON to `webhookUrl`.
 * Returns { statusCode, body } on success.
 */
function forwardToWebhook(webhookUrl, payload) {
	return new Promise((resolve, reject) => {
		const data = JSON.stringify(payload);
		const url = new URL(webhookUrl);
		const client = url.protocol === 'https:' ? https : http;

		const req = client.request(
			url,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json; charset=utf-8',
					'Content-Length': Buffer.byteLength(data, 'utf8'),
				},
			},
			(res) => {
				let body = '';
				res.on('data', (chunk) => {
					body += chunk;
				});
				res.on('end', () => resolve({ statusCode: res.statusCode, body }));
			},
		);

		req.on('error', reject);
		req.write(data, 'utf8');
		req.end();
	});
}

/**
 * Lambda entry point.
 *
 * Processes each SQS record in the batch:
 *   1. Parse the JSON message body
 *   2. Forward it to WEBHOOK_URL with metadata envelope
 *   3. Collect per-record results — errors are logged but not re-thrown
 *      so a single bad record doesn't block the whole batch
 */
exports.handler = async (event) => {
	const webhookUrl = process.env.WEBHOOK_URL;
	const projectKey = process.env.CTP_PROJECT_KEY;
	const eventType = process.env.EVENT_TYPE;
	const results = [];

	for (const record of event.Records || []) {
		try {
			const messageBody = typeof record.body === 'string' ? JSON.parse(record.body) : record.body;

			const receivedEventType = messageBody.type ?? eventType;

			const webhookPayload = {
				eventType: receivedEventType,
				rawMessage: messageBody,
				source: 'CommerceTools-Lambda',
				timestamp: new Date().toISOString(),
				projectKey,
			};

			if (webhookUrl) {
				const result = await forwardToWebhook(webhookUrl, webhookPayload);
				console.log(JSON.stringify({ event: receivedEventType, status: result.statusCode }));
			}

			results.push({ status: 'success', eventType: receivedEventType });
		} catch (error) {
			console.error(JSON.stringify({ error: error.message, record: record.messageId }));
			results.push({ status: 'error', error: error.message });
		}
	}

	return {
		statusCode: 200,
		body: JSON.stringify({ processed: results.length, results }),
	};
};
