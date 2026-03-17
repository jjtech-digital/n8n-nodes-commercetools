import { INode, NodeOperationError } from 'n8n-workflow';
import { PubSub } from '@google-cloud/pubsub';
import AdmZip from 'adm-zip';
import { Storage } from '@google-cloud/storage';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

export type GCPResponse = {
	topicName: string;
	projectId: string;
	bucketName: string;
	functionName: string;
};

// ─── Credential helpers ───────────────────────────────────────────────────────
type ParsedGCPCreds = {
	projectId: string;
	clientEmail: string;
	privateKey: string;
};

/**
 * Ensures a PEM private key has real newlines, not escaped \n literals.
 * Handles all common storage/transport mangling formats n8n may produce.
 */
function normalizePrivateKey(key: string): string {
	return key
		.trim()
		.replace(/\\n/g, '\n') // literal \n text → real newline
		.replace(/\\r/g, '') // strip any \r artifacts
		.replace(/\r\n/g, '\n') // Windows line endings → Unix
		.replace(/\r/g, '\n'); // stray \r → newline
}

/**
 * Normalise credentials from n8n into the three fields we need.
 *
 * Preferred shape: paste the entire GCP service account JSON into a single
 * `serviceAccountJson` credential field. n8n treats it as opaque text and
 * passes it through unchanged. JSON.parse then recovers the real private_key
 * PEM string with newlines already correct.
 *
 * Exported so other files (e.g. triggerMethods) can parse credentials without
 * duplicating logic.
 */
export function parseCredentials(raw: Record<string, string>): ParsedGCPCreds {
	// Shape 1: full service account JSON in a single field (preferred)
	const jsonStr = raw.serviceAccountJson ?? raw.serviceAccountKey ?? '';
	if (jsonStr) {
		let parsed: Record<string, string>;
		try {
			parsed = JSON.parse(jsonStr);
		} catch {
			throw new Error(
				'GCP serviceAccountJson is not valid JSON — paste the entire downloaded key file as-is',
			);
		}
		const projectId = parsed.project_id ?? raw.gcpProjectId ?? '';
		const clientEmail = parsed.client_email ?? '';
		// JSON.parse restores real newlines automatically; normalizePrivateKey
		// handles any edge-case double-encoding that may survive the round-trip.
		const privateKey = normalizePrivateKey(parsed.private_key ?? '');

		if (!projectId) throw new Error('GCP service account JSON missing project_id');
		if (!clientEmail) throw new Error('GCP service account JSON missing client_email');
		if (!privateKey) throw new Error('GCP service account JSON missing private_key');
		if (!privateKey.includes('-----BEGIN')) {
			throw new Error('GCP private_key in JSON does not look like a valid PEM key');
		}
		return { projectId, clientEmail, privateKey };
	}

	// Shape 2: separate fields (legacy / fallback)
	const projectId = raw.gcpProjectId ?? '';
	const clientEmail = raw.clientEmail ?? raw.client_email ?? '';
	const privateKey = normalizePrivateKey(raw.privateKey ?? raw.private_key ?? '');
	if (!projectId) throw new Error('GCP credential missing gcpProjectId');
	if (!clientEmail) throw new Error('GCP credential missing clientEmail');
	if (!privateKey) throw new Error('GCP credential missing privateKey');
	if (!privateKey.includes('-----BEGIN')) {
		throw new Error(
			`GCP privateKey does not look like a PEM key (got: ${privateKey.substring(0, 40)}...). ` +
				`n8n may be hashing the field value. Use the "Service Account JSON" field instead: ` +
				`paste the entire downloaded GCP key JSON file into a single credential field named serviceAccountJson.`,
		);
	}
	return { projectId, clientEmail, privateKey };
}

/**
 * Build a GoogleAuth client, eagerly exchange the JWT for an access token,
 * and validate the token is actually present before returning.
 *
 * In production n8n the service account JSON can arrive via secrets managers
 * or env vars that stringify differently from local. We build an explicit
 * JWT-based client so there is no ambiguity about which credential path the
 * googleapis library takes — it always uses the token we hand it directly.
 *
 * Using google.auth.JWT + authorize() instead of GoogleAuth ensures:
 * 1. The JWT is signed with our private key unconditionally (no ADC fallback)
 * 2. The resulting token is validated before any infrastructure calls are made
 * 3. google.options({ auth }) propagates the token to every subsequent client
 */
export async function buildAuthClient(raw: Record<string, string>) {
	const creds = parseCredentials(raw);

	// Build a JWT client directly so we fully control the sign → exchange flow,
	// bypassing GoogleAuth's internal credential-detection that can fall through
	// to ADC / metadata server in production container environments.
	const jwtClient = new google.auth.JWT({
		email: creds.clientEmail,
		key: creds.privateKey,
		scopes: ['https://www.googleapis.com/auth/cloud-platform'],
	});

	// Exchange JWT for an OAuth2 access token now (pre-warm + validation).
	const tokenResponse = await jwtClient.authorize();

	if (!tokenResponse?.access_token) {
		throw new Error(
			'GCP authentication failed: JWT authorize() returned no access_token. ' +
				'Check that the service account key is valid and has not been revoked.',
		);
	}

	// Set as the global default so every google.* client created after this
	// automatically carries the same pre-warmed credential.
	google.options({ auth: jwtClient });

	return { restAuth: jwtClient as unknown as OAuth2Client };
}

// ─── Cloud Function source (static) ──────────────────────────────────────────
// The webhook URL is injected via the WEBHOOK_URL env var at deploy time, so
// the source itself never changes between calls. Define it once as a constant
// and pre-build the zip at module-load time — no zip work on the hot path.
const FUNCTION_SOURCE = `
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
	console.log('Decoded Pub/Sub message:', decoded);

	let parsed;
	try {
		parsed = JSON.parse(decoded);
	} catch (e) {
		console.error('Pub/Sub message is not valid JSON:', decoded);
		return;
	}

	const body = JSON.stringify(parsed);
	const bodyBuffer = Buffer.from(body, 'utf-8');

	return new Promise((resolve, reject) => {
		const parsedUrl = new URL(webhookUrl);
		const client = parsedUrl.protocol === 'https:' ? https : http;
		const req = client.request(webhookUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Content-Length': bodyBuffer.length,
			},
		}, (res) => {
			let responseBody = '';
			res.setEncoding('utf-8');
			res.on('data', (chunk) => { responseBody += chunk; });
			res.on('end', () => {
				if (res.statusCode >= 200 && res.statusCode < 300) {
					console.log('Webhook delivered successfully, status:', res.statusCode);
					resolve();
				} else {
					console.error('Webhook returned error status:', res.statusCode, 'body:', responseBody);
					reject(new Error('Webhook returned status ' + res.statusCode + ': ' + responseBody));
				}
			});
		});
		req.on('error', (err) => {
			console.error('HTTP request to webhook failed:', err.message);
			reject(err);
		});
		req.write(bodyBuffer);
		req.end();
	});
});
`;

const PACKAGE_JSON = JSON.stringify(
	{
		name: 'n8n-ct-webhook',
		version: '1.0.0',
		main: 'index.js',
		dependencies: { '@google-cloud/functions-framework': '^3.0.0' },
	},
	null,
	2,
);

// Pre-build the zip once at module load — reused across every deployment call.
const PREBUILT_ZIP: Buffer = (() => {
	const zip = new AdmZip();
	zip.addFile('index.js', Buffer.from(FUNCTION_SOURCE, 'utf8'));
	zip.addFile('package.json', Buffer.from(PACKAGE_JSON, 'utf8'));
	return zip.toBuffer();
})();

const REQUIRED_APIS = [
	'cloudfunctions.googleapis.com',
	'cloudbuild.googleapis.com',
	'artifactregistry.googleapis.com',
	'run.googleapis.com',
	'eventarc.googleapis.com',
];

// ─── Create ───────────────────────────────────────────────────────────────────
export async function createGCPInfrastructure(
	gcpCredentials: Record<string, string>,
	webhookUrl: string,
	eventType: string,
): Promise<GCPResponse> {
	try {
		// Parse credentials synchronously, then kick off auth token pre-warm
		// immediately so JWT-sign + token-exchange runs while we do other setup.
		const creds = parseCredentials(gcpCredentials);
		const authPromise = buildAuthClient(gcpCredentials);

		const eventSlug = eventType.toLowerCase().slice(0, 30);
		const timestamp = Date.now();
		const topicName = `ct-${eventSlug}-${timestamp}`;
		const bucketName = `ct-${eventSlug}-bucket-${timestamp}`;
		const fnName = `ct-${eventSlug}-fn-${timestamp}`;
		const zipObject = `${fnName}.zip`;
		const url = new URL(webhookUrl);
		const { projectId, clientEmail, privateKey } = creds;

		// Await auth — likely already resolved by the time we reach this line
		const { restAuth } = await authPromise;

		const pubsub = new PubSub({
			projectId,
			credentials: { client_email: clientEmail, private_key: privateKey },
		});
		const storage = new Storage({
			projectId,
			credentials: { client_email: clientEmail, private_key: privateKey },
		});
		const pubsubApi = google.pubsub({ version: 'v1', auth: restAuth });
		const bucket = storage.bucket(bucketName);

		// ── All independent setup in parallel ─────────────────────────────────
		await Promise.all([
			// 1. Create Pub/Sub topic then grant CT publish permission
			pubsub
				.topic(topicName)
				.get({ autoCreate: true })
				.then(() =>
					pubsubApi.projects.topics.setIamPolicy({
						resource: `projects/${projectId}/topics/${topicName}`,
						requestBody: {
							policy: {
								bindings: [
									{
										role: 'roles/pubsub.publisher',
										members: [
											'serviceAccount:subscriptions@commercetools-platform.iam.gserviceaccount.com',
										],
									},
								],
							},
						},
					}),
				),

			// 2. Create bucket (ignore 409 already-exists) then upload the
			//    pre-built zip — no zip construction on the hot path
			bucket
				.create({ location: gcpCredentials.gcpRegion })
				.catch((err) => {
					if (err.code !== 409) throw err;
				})
				.then(() =>
					bucket.file(zipObject).save(PREBUILT_ZIP, {
						contentType: 'application/zip',
						resumable: false,
					}),
				),

			// 3. Enable required GCP APIs — checks current state first so
			//    already-enabled APIs skip the enable round-trip entirely
			enableRequiredApis(restAuth, projectId),
		]);

		// ── Deploy Cloud Function (Gen2) ──────────────────────────────────────
		const cloudfunctions = google.cloudfunctions({ version: 'v2', auth: restAuth });
		const parent = `projects/${projectId}/locations/${gcpCredentials.gcpRegion}`;

		const createOp = await cloudfunctions.projects.locations.functions.create({
			parent,
			functionId: fnName,
			requestBody: {
				name: `${parent}/functions/${fnName}`,
				buildConfig: {
					runtime: 'nodejs20',
					entryPoint: 'cloudFunctionCode',
					source: { storageSource: { bucket: bucketName, object: zipObject } },
				},
				serviceConfig: {
					timeoutSeconds: 300,
					environmentVariables: { WEBHOOK_URL: url.toString() },
				},
				eventTrigger: {
					triggerRegion: gcpCredentials.gcpRegion,
					eventType: 'google.cloud.pubsub.topic.v1.messagePublished',
					pubsubTopic: `projects/${projectId}/topics/${topicName}`,
					retryPolicy: 'RETRY_POLICY_RETRY',
				},
			},
		});

		// ── Poll with immediate first check + exponential backoff ─────────────
		// initialDelayMs: 0 → checks immediately after create() returns in case
		// GCP already finished (common for warm projects).
		// The sleep timer and status GET run concurrently so GET latency doesn't
		// compound on top of the delay: cadence = max(delay, getLatency).
		await pollUntilDone(
			() =>
				cloudfunctions.projects.locations.operations.get({
					name: createOp.data.name!,
				}),
			{ initialDelayMs: 0, stepMs: 1000, maxDelayMs: 5000, backoffFactor: 1.5 },
		);

		return { topicName, bucketName, projectId, functionName: fnName };
	} catch (err) {
		throw new NodeOperationError(
			{} as INode,
			`Failed to create GCP infrastructure: ${err.message ?? err}`,
		);
	}
}

// ─── Delete ───────────────────────────────────────────────────────────────────
export async function deleteGCPInfrastructure(
	gcpCredentials: Record<string, string>,
	infrastructure: GCPResponse,
): Promise<void> {
	try {
		const creds = parseCredentials(gcpCredentials);
		const { restAuth } = await buildAuthClient(gcpCredentials);
		const { clientEmail, privateKey } = creds;

		const cloudfunctions = google.cloudfunctions({ version: 'v2', auth: restAuth });
		const pubsub = new PubSub({
			projectId: infrastructure.projectId,
			credentials: { client_email: clientEmail, private_key: privateKey },
		});
		const storage = new Storage({
			projectId: infrastructure.projectId,
			credentials: { client_email: clientEmail, private_key: privateKey },
		});

		// Delete all three resources in parallel — none depend on each other.
		// allSettled ensures a single failure doesn't suppress the other deletions.
		const results = await Promise.allSettled([
			// Cloud Function
			cloudfunctions.projects.locations.functions
				.delete({
					name: `projects/${infrastructure.projectId}/locations/${gcpCredentials.gcpRegion}/functions/${infrastructure.functionName}`,
				})
				.catch((err) => {
					if (err.code !== 5) throw err; // 5 = NOT_FOUND, already gone
				}),

			// Pub/Sub topic
			pubsub
				.topic(infrastructure.topicName)
				.delete()
				.catch((err) => {
					if (err.code !== 5) throw err;
				}),

			// GCS bucket — files must be purged before the bucket itself
			(async () => {
				const bucket = storage.bucket(infrastructure.bucketName);
				await bucket.deleteFiles({ force: true });
				await bucket.delete();
			})().catch((err) => {
				if (err.code !== 5) throw err;
			}),
		]);

		const failed = results.filter((r) => r.status === 'rejected');
		if (failed.length) {
			throw new Error(failed.map((f) => f.reason?.message ?? f.reason).join('; '));
		}
	} catch (error) {
		throw new NodeOperationError(
			{} as INode,
			`Failed to delete GCP infrastructure: ${error.message ?? error}. You may need to manually clean up in GCP Console.`,
		);
	}
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Enable all required GCP APIs in parallel.
 * Checks current state first — already-enabled APIs are skipped entirely,
 * saving one enable round-trip per service on every subsequent deployment.
 */
async function enableRequiredApis(auth: OAuth2Client, projectId: string): Promise<void> {
	const serviceusage = google.serviceusage({ version: 'v1', auth });

	await Promise.all(
		REQUIRED_APIS.map(async (service) => {
			const name = `projects/${projectId}/services/${service}`;
			try {
				const { data } = await serviceusage.services.get({ name });
				if (data.state === 'ENABLED') return; // already active — skip enable call
			} catch {
				// get() failure is non-fatal; fall through and attempt enable
			}
			await serviceusage.services.enable({ name }).catch(() => {});
		}),
	);
}

/**
 * Generic long-operation poller with configurable exponential backoff.
 *
 * Key behaviour:
 * - initialDelayMs: 0  → first status check fires immediately after create()
 * - The sleep timer and the GET request run via Promise.all so the GET's
 *   network latency doesn't stack on top of the delay:
 *   effective cadence = max(delayMs, getLatency) not delayMs + getLatency
 */
async function pollUntilDone(
	getFn: () => Promise<{ data: { done?: boolean | null; error?: unknown } }>,
	opts: {
		initialDelayMs: number;
		stepMs: number;
		maxDelayMs: number;
		backoffFactor: number;
	},
): Promise<void> {
	let delay = opts.initialDelayMs;
	while (true) {
		const [op] = await Promise.all([getFn(), new Promise<void>((r) => setTimeout(r, delay))]);
		if (op.data.done) {
			if (op.data.error) throw new Error(`Deployment failed: ${JSON.stringify(op.data.error)}`);
			return;
		}
		delay =
			delay === 0 ? opts.stepMs : Math.min(Math.ceil(delay * opts.backoffFactor), opts.maxDelayMs);
	}
}
