/**
 * nodes/Commercetools/utils/gcpInfra.utils.ts
 *
 * Provisions GCP infrastructure for the CommercetoolsTrigger node:
 *   Pub/Sub topic → GCS bucket → Cloud Function (Gen2) with Eventarc trigger
 *
 * Bug fixes applied:
 *   GCP-BUG-1: gcpRegion is validated before use — an empty region now throws
 *              a descriptive error instead of producing invalid API paths.
 *   GCP-BUG-2: createGCPInfrastructure stores `gcpRegion` in the returned
 *              GCPResponse so deletion uses the region recorded at creation
 *              time (fixed in gcpDelete.utils.ts).
 *   GCP-BUG-3: NodeOperationError now requires a real INode from the caller;
 *              `{} as INode` removed.
 *   GCP-BP-1:  enableRequiredApis logs individual enable failures instead of
 *              silently swallowing them.
 *   GCP-READ-1: Cloud Function source moved to lambda/gcpHandler.js (read
 *               from disk) — no more embedded template strings.
 *
 * Deletion logic moved to gcpDelete.utils.ts to keep this file ≤ 300 lines.
 */

import * as fs from 'fs';
import * as path from 'path';
import { PubSub } from '@google-cloud/pubsub';
import { Storage } from '@google-cloud/storage';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import AdmZip from 'adm-zip';
import type { INode } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

export { deleteGCPInfrastructure } from './gcpDelete.utils';

export type GCPResponse = {
	topicName: string;
	projectId: string;
	bucketName: string;
	functionName: string;
	/** GCP-BUG-2: stored so deletion uses the creation-time region */
	region?: string;
};

// ─── Credential helpers ───────────────────────────────────────────────────────

type ParsedGCPCreds = { projectId: string; clientEmail: string; privateKey: string };

function normalizePrivateKey(key: string): string {
	return key
		.trim()
		.replace(/\\n/g, '\n')
		.replace(/\\r/g, '')
		.replace(/\r\n/g, '\n')
		.replace(/\r/g, '\n');
}

export function parseCredentials(raw: Record<string, string>): ParsedGCPCreds {
	const jsonStr = raw.serviceAccountJson ?? raw.serviceAccountKey ?? '';
	if (jsonStr) {
		let parsed: Record<string, string>;
		try {
			parsed = JSON.parse(jsonStr);
		} catch {
			throw new Error('GCP serviceAccountJson is not valid JSON — paste the entire key file as-is');
		}
		const projectId = parsed.project_id ?? raw.gcpProjectId ?? '';
		const clientEmail = parsed.client_email ?? '';
		const privateKey = normalizePrivateKey(parsed.private_key ?? '');
		if (!projectId) throw new Error('GCP service account JSON missing project_id');
		if (!clientEmail) throw new Error('GCP service account JSON missing client_email');
		if (!privateKey) throw new Error('GCP service account JSON missing private_key');
		if (!privateKey.includes('-----BEGIN'))
			throw new Error('GCP private_key in JSON does not look like a valid PEM key');
		return { projectId, clientEmail, privateKey };
	}
	const projectId = raw.gcpProjectId ?? '';
	const clientEmail = raw.clientEmail ?? raw.client_email ?? '';
	const privateKey = normalizePrivateKey(raw.privateKey ?? raw.private_key ?? '');
	if (!projectId) throw new Error('GCP credential missing gcpProjectId');
	if (!clientEmail) throw new Error('GCP credential missing clientEmail');
	if (!privateKey || !privateKey.includes('-----BEGIN'))
		throw new Error(
			'GCP privateKey does not look like a PEM key. Use the Service Account JSON field.',
		);
	return { projectId, clientEmail, privateKey };
}

export async function buildAuthClient(raw: Record<string, string>) {
	const creds = parseCredentials(raw);
	const jwtClient = new google.auth.JWT({
		email: creds.clientEmail,
		key: creds.privateKey,
		scopes: ['https://www.googleapis.com/auth/cloud-platform'],
	});
	const tokenResponse = await jwtClient.authorize();
	if (!tokenResponse?.access_token) {
		throw new Error('GCP authentication failed: JWT authorize() returned no access_token.');
	}
	return { restAuth: jwtClient as unknown as OAuth2Client };
}

// ─── Cloud Function source — read from disk (GCP-READ-1) ─────────────────────

const GCP_HANDLER_PATH = path.resolve(__dirname, '../lambda/gcpHandler.js');

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

function buildFunctionZip(): Buffer {
	const functionSource = fs.readFileSync(GCP_HANDLER_PATH, 'utf8');
	const zip = new AdmZip();
	zip.addFile('index.js', Buffer.from(functionSource, 'utf8'));
	zip.addFile('package.json', Buffer.from(PACKAGE_JSON, 'utf8'));
	return zip.toBuffer();
}

// Pre-build once at module load — reused across every deployment call
const PREBUILT_ZIP: Buffer = buildFunctionZip();

// ─── Required APIs ────────────────────────────────────────────────────────────

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
	node?: INode,
): Promise<GCPResponse> {
	// GCP-BUG-1: validate gcpRegion early
	const gcpRegion = gcpCredentials.gcpRegion;
	if (!gcpRegion) {
		throw new NodeOperationError(
			node!,
			'GCP credential is missing "gcpRegion". Select a deployment region.',
		);
	}

	try {
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

		await Promise.all([
			// Create Pub/Sub topic + grant CT publish permission
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

			// Create bucket + upload pre-built zip
			bucket
				.create({ location: gcpRegion })
				.catch((err: unknown) => {
					if ((err as { code?: number }).code !== 409) throw err;
				})
				.then(() =>
					bucket
						.file(zipObject)
						.save(PREBUILT_ZIP, { contentType: 'application/zip', resumable: false }),
				),

			// Enable required APIs
			enableRequiredApis(restAuth, projectId),
		]);

		const cloudfunctions = google.cloudfunctions({ version: 'v2', auth: restAuth });
		const parent = `projects/${projectId}/locations/${gcpRegion}`;

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
					triggerRegion: gcpRegion,
					eventType: 'google.cloud.pubsub.topic.v1.messagePublished',
					pubsubTopic: `projects/${projectId}/topics/${topicName}`,
					retryPolicy: 'RETRY_POLICY_RETRY',
				},
			},
		});

		await pollUntilDone(
			() => cloudfunctions.projects.locations.operations.get({ name: createOp.data.name! }),
			{ initialDelayMs: 0, stepMs: 1000, maxDelayMs: 5000, backoffFactor: 1.5 },
		);

		// GCP-BUG-2: include region in response so deletion uses creation-time value
		return { topicName, bucketName, projectId, functionName: fnName, region: gcpRegion };
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		throw new NodeOperationError(node!, `Failed to create GCP infrastructure: ${msg}`);
	}
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

async function enableRequiredApis(auth: OAuth2Client, projectId: string): Promise<void> {
	const serviceusage = google.serviceusage({ version: 'v1', auth });
	await Promise.all(
		REQUIRED_APIS.map(async (service) => {
			const name = `projects/${projectId}/services/${service}`;
			try {
				const { data } = await serviceusage.services.get({ name });
				if (data.state === 'ENABLED') return;
			} catch {
				// get() failure is non-fatal; fall through and try enable
			}
			try {
				await serviceusage.services.enable({ name });
			} catch (err) {
				// GCP-BP-1: log enable failures instead of silently swallowing them
				console.warn(`[CT GCP] Could not enable ${service}:`, (err as Error).message);
			}
		}),
	);
}

async function pollUntilDone(
	getFn: () => Promise<{ data: { done?: boolean | null; error?: unknown } }>,
	opts: {
		initialDelayMs: number;
		stepMs: number;
		maxDelayMs: number;
		backoffFactor: number;
		maxAttempts?: number;
	},
): Promise<void> {
	const maxAttempts = opts.maxAttempts ?? 120;
	let delay = opts.initialDelayMs;
	let attempts = 0;
	while (attempts < maxAttempts) {
		const [op] = await Promise.all([getFn(), new Promise<void>((r) => setTimeout(r, delay))]);
		if (op.data.done) {
			if (op.data.error) throw new Error(`Deployment failed: ${JSON.stringify(op.data.error)}`);
			return;
		}
		attempts++;
		delay =
			delay === 0 ? opts.stepMs : Math.min(Math.ceil(delay * opts.backoffFactor), opts.maxDelayMs);
	}
	throw new Error(`Deployment timed out after ${maxAttempts} polling attempts`);
}
