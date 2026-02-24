import { INode, NodeOperationError } from 'n8n-workflow';
import { PubSub } from '@google-cloud/pubsub';
import AdmZip from 'adm-zip';
import { Storage, StorageOptions } from '@google-cloud/storage';
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
 * Normalise credentials from n8n into the three fields we need.
 *
 * n8n encrypts individual credential fields, so values like `privateKey`
 * arrive as an opaque hash rather than the original PEM content.
 *
 * Solution: store the entire GCP service account JSON in a single
 * `serviceAccountJson` credential field. n8n treats it as opaque text
 * and passes it through unchanged. JSON.parse then recovers the real
 * private_key PEM string with newlines already correct.
 *
 * Users paste the full contents of the downloaded .json key file.
 */
function parseCredentials(raw: Record<string, string>): ParsedGCPCreds {
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
		const privateKey = parsed.private_key ?? '';
		if (!projectId) throw new Error('GCP service account JSON missing project_id');
		if (!clientEmail) throw new Error('GCP service account JSON missing client_email');
		if (!privateKey) throw new Error('GCP service account JSON missing private_key');
		return { projectId, clientEmail, privateKey };
	}
	// Shape 2: separate fields — clientEmail + privateKey stored individually.
	// n8n hashes credential fields individually, so privateKey may arrive as
	// an opaque hash. If it looks like a valid PEM key, use it directly.
	const projectId = raw.gcpProjectId ?? '';
	const clientEmail = raw.clientEmail ?? raw.client_email ?? '';
	const privateKey = (raw.privateKey ?? raw.private_key ?? '').trim().replace(/\\n/g, '\n'); // literal \\n text (stored by n8n) → real newline
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
 * Build auth clients for GCP services.
 *
 * Two separate clients are needed:
 *   - JWT         → gRPC-based clients (PubSub, Storage) via authClient option
 *   - GoogleAuth  → googleapis REST client (Cloud Functions) via auth option
 *
 * The JWT is passed via `authClient:` to gRPC libs, bypassing their internal
 * credential plugin chain (which hits OpenSSL directly and throws DECODER errors).
 *
 * GoogleAuth is used for googleapis REST calls — it correctly manages token
 * lifecycle, refresh, and Authorization header injection. Passing a raw JWT
 * directly to `googleapis`'s `auth:` option can result in "Login Required"
 * if the library calls getAccessToken() in a way that bypasses the JWT's cache.
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
		grpcAuth: client,
		restAuth: client as OAuth2Client,
	};
}
// ─── Create ───────────────────────────────────────────────────────────────────
export async function createGCPInfrastructure(
	gcpCredentials: Record<string, string>,
	webhookUrl: string,
): Promise<GCPResponse> {
	try {
		const { grpcAuth, restAuth } = await buildAuthClient(gcpCredentials);
		const projectId = parseCredentials(gcpCredentials).projectId;
		const timestamp = Date.now();
		const topicName = `ct-${gcpCredentials.gcpTopicName}-${timestamp}`;
		const bucketName = `ct-${gcpCredentials.gcpTopicName}-bucket-${timestamp}`;
		const fnName = `ct-${gcpCredentials.gcpTopicName}-fn-${timestamp}`;
		// ── 1. Pub/Sub topic ─────────────────────────────────────────────────
		// authClient passed directly — PubSub never touches the raw key bytes.
		const pubsub = new PubSub({ projectId, authClient: grpcAuth });
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
		if (url.hostname === 'localhost') {
			url.hostname = '59d7-103-120-60-7.ngrok-free.app';
			url.protocol = 'https';
			url.port = '';
		}
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
		// ── 5. GCS bucket + upload ─────────────────────────────────
		const creds = parseCredentials(gcpCredentials);
		const storage = new Storage({
			projectId,
			credentials: {
				client_email: creds.clientEmail,
				private_key: creds.privateKey,
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
		// restAuth is GoogleAuth — googleapis calls .getClient() internally,
		// which correctly manages token refresh and Authorization headers.
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
		const { grpcAuth, restAuth } = await buildAuthClient(gcpCredentials);
		const cloudfunctions = google.cloudfunctions({ version: 'v2', auth: restAuth });
		const fnFullName = `projects/${infrastructure.projectId}/locations/${gcpCredentials.gcpRegion}/functions/${infrastructure.functionName}`;
		try {
			await cloudfunctions.projects.locations.functions.delete({ name: fnFullName });
		} catch (err) {
			if (err.code !== 5) throw err;
		}
		const pubsub = new PubSub({ projectId: infrastructure.projectId, authClient: grpcAuth });
		try {
			await pubsub.topic(infrastructure.topicName).delete();
		} catch (err) {
			if (err.code !== 5) throw err;
		}
		const storage = new Storage({
			projectId: infrastructure.projectId,
			authClient: grpcAuth,
		} as unknown as StorageOptions);
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
async function enableRequiredApis(auth: OAuth2Client, projectId: string) {
	const serviceusage = google.serviceusage({
		version: 'v1',
		auth,
	});
	const services = [
		'cloudfunctions.googleapis.com',
		'cloudbuild.googleapis.com',
		'artifactregistry.googleapis.com',
		'run.googleapis.com',
		'eventarc.googleapis.com',
	];
	for (const service of services) {
		await serviceusage.services
			.enable({
				name: `projects/${projectId}/services/${service}`,
			})
			.catch(() => {});
	}
}
