import { INode, NodeOperationError } from 'n8n-workflow';
import { PubSub } from '@google-cloud/pubsub';
import AdmZip from 'adm-zip';
import { Storage } from '@google-cloud/storage';
import { google } from 'googleapis';
import { GoogleAuth, OAuth2Client } from 'google-auth-library';
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
 * Build a GoogleAuth client for REST-based googleapis calls (Cloud Functions,
 * Pub/Sub IAM policy, Service Usage).
 *
 * PubSub and Storage are instantiated with `credentials: {}` directly —
 * this bypasses the gRPC auth-plugin chain that hits OpenSSL and throws
 * the DECODER routines::unsupported error when the key has encoding issues.
 */
export async function buildAuthClient(raw: Record<string, string>) {
	const creds = parseCredentials(raw);
	const auth = new GoogleAuth({
		credentials: {
			client_email: creds.clientEmail,
			private_key: creds.privateKey,
		},
		scopes: ['https://www.googleapis.com/auth/cloud-platform'],
		projectId: creds.projectId,
		clientOptions: {
			quotaProjectId: creds.projectId,
		},
	});
	const client = await auth.getClient();
	return {
		restAuth: client as OAuth2Client,
	};
}
// ─── Create ───────────────────────────────────────────────────────────────────
export async function createGCPInfrastructure(
	gcpCredentials: Record<string, string>,
	webhookUrl: string,
	eventType: string,
): Promise<GCPResponse> {
	try {
		const creds = parseCredentials(gcpCredentials);
		const { restAuth } = await buildAuthClient(gcpCredentials);
		const { projectId, clientEmail, privateKey } = creds;
		const timestamp = Date.now();
		const topicName = `ct-${eventType.toLowerCase()}-${timestamp}`;
		const bucketName = `ct-${eventType.toLowerCase()}-bucket-${timestamp}`;
		const fnName = `ct-${eventType.toLowerCase()}-fn-${timestamp}`;
		// ── 1. Pub/Sub topic ─────────────────────────────────────────────────
		// Use credentials: {} directly — avoids the gRPC auth plugin / OpenSSL path
		const pubsub = new PubSub({
			projectId,
			credentials: {
				client_email: clientEmail,
				private_key: privateKey,
			},
		});
		await pubsub.topic(topicName).get({ autoCreate: true });
		// Grant CT's service account publish permission on the topic
		const pubsubApi = google.pubsub({ version: 'v1', auth: restAuth });
		await pubsubApi.projects.topics.setIamPolicy({
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
		});
		// ── 2. Resolve webhook URL ────────────────────────────────────────────
		const url = new URL(webhookUrl);

		// ── 3. Cloud Function source ──────────────────────────────────────────
		const jsCode = `
			const functions = require('@google-cloud/functions-framework');
			const https = require('https');
			const http = require('http');
			functions.cloudEvent('cloudFunctionCode', (cloudEvent) => {
				const webhookUrl = process.env.WEBHOOK_URL;
				if (!webhookUrl) {
					console.error('FATAL: WEBHOOK_URL not set');
					return;
				}
				const base64data = cloudEvent.data?.message?.data;
				if (!base64data) {
					console.warn('No Pub/Sub message data');
					return;
				}
				const body = Buffer.from(base64data, 'base64').toString('utf-8');
				return new Promise((resolve, reject) => {
					const parsedUrl = new URL(webhookUrl);
					const client    = parsedUrl.protocol === 'https:' ? https : http;
					const req = client.request(webhookUrl, {
						method: 'POST',
						headers: {
							'Content-Type':   'application/json',
							'Content-Length': Buffer.byteLength(body),
						},
					}, (res) => { res.resume(); res.on('end', resolve); });
					req.on('error', reject);
					req.write(body);
					req.end();
				});
			});
			`;
		const packageJson = {
			name: 'n8n-ct-webhook',
			version: '1.0.0',
			main: 'index.js',
			dependencies: { '@google-cloud/functions-framework': '^3.0.0' },
		};
		// ── 4. Zip ────────────────────────────────────────────────────────────
		const zip = new AdmZip();
		zip.addFile('index.js', Buffer.from(jsCode, 'utf8'));
		zip.addFile('package.json', Buffer.from(JSON.stringify(packageJson, null, 2), 'utf8'));
		const zipBuffer = zip.toBuffer();
		// ── 5. GCS bucket + upload ────────────────────────────────────────────
		// Use credentials: {} directly — same reason as PubSub above
		const storage = new Storage({
			projectId,
			credentials: {
				client_email: clientEmail,
				private_key: privateKey,
			},
		});
		const bucket = storage.bucket(bucketName);
		const [exists] = await bucket.exists();
		if (!exists) {
			await bucket.create({ location: gcpCredentials.gcpRegion });
		}
		const zipObject = `${fnName}.zip`;
		await bucket.file(zipObject).save(zipBuffer, {
			contentType: 'application/zip',
			resumable: false,
		});

		// ── 6. Deploy Cloud Function (Gen2) ───────────────────────────────────
		await enableRequiredApis(restAuth, projectId);
		const cloudfunctions = google.cloudfunctions({ version: 'v2', auth: restAuth });
		const parent = `projects/${projectId}/locations/${gcpCredentials.gcpRegion}`;
		const fullName = `${parent}/functions/${fnName}`;
		const createOp = await cloudfunctions.projects.locations.functions.create({
			parent,
			functionId: fnName,
			requestBody: {
				name: fullName,
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
		while (true) {
			const op = await cloudfunctions.projects.locations.operations.get({
				name: createOp.data.name!,
			});
			if (op.data.done) {
				if (op.data.error) throw new Error(`Deployment failed: ${JSON.stringify(op.data.error)}`);
				break;
			}
			await new Promise((r) => setTimeout(r, 3000));
		}
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
		// ── Cloud Function ────────────────────────────────────────────────────
		const cloudfunctions = google.cloudfunctions({ version: 'v2', auth: restAuth });
		const fnFullName = `projects/${infrastructure.projectId}/locations/${gcpCredentials.gcpRegion}/functions/${infrastructure.functionName}`;
		try {
			await cloudfunctions.projects.locations.functions.delete({ name: fnFullName });
		} catch (err) {
			if (err.code !== 5) throw err;
		}
		// ── Pub/Sub topic ─────────────────────────────────────────────────────
		const pubsub = new PubSub({
			projectId: infrastructure.projectId,
			credentials: {
				client_email: clientEmail,
				private_key: privateKey,
			},
		});
		try {
			await pubsub.topic(infrastructure.topicName).delete();
		} catch (err) {
			if (err.code !== 5) throw err;
		}
		// ── GCS bucket ────────────────────────────────────────────────────────
		const storage = new Storage({
			projectId: infrastructure.projectId,
			credentials: {
				client_email: clientEmail,
				private_key: privateKey,
			},
		});
		try {
			const bucket = storage.bucket(infrastructure.bucketName);
			await bucket.deleteFiles({ force: true });
			await bucket.delete();
		} catch (err) {
			if (err.code !== 5) throw err;
		}
	} catch (error) {
		throw new NodeOperationError(
			{} as INode,
			`Failed to delete GCP infrastructure: ${error.message ?? error}. You may need to manually clean up in GCP Console.`,
		);
	}
}
// ─── Internal helpers ─────────────────────────────────────────────────────────
async function enableRequiredApis(auth: OAuth2Client, projectId: string) {
	const serviceusage = google.serviceusage({ version: 'v1', auth });
	const services = [
		'cloudfunctions.googleapis.com',
		'cloudbuild.googleapis.com',
		'artifactregistry.googleapis.com',
		'run.googleapis.com',
		'eventarc.googleapis.com',
	];
	for (const service of services) {
		await serviceusage.services
			.enable({ name: `projects/${projectId}/services/${service}` })
			.catch(() => {});
	}
}
