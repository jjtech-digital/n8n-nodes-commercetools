import { INode, NodeOperationError } from 'n8n-workflow';
import { PubSub } from '@google-cloud/pubsub';
import AdmZip from 'adm-zip';
import { Storage } from '@google-cloud/storage';
import { google } from 'googleapis';

export type GCPResponse = {
	topicName: string;
	projectId: string;
	bucketName: string;
	functionName: string;
};

export async function createGCPInfrastructure(
	gcpCredentials: Record<string, string>,
	webhookUrl: string,
): Promise<GCPResponse> {
	try {
		const pubsub = new PubSub({ projectId: gcpCredentials.gcpProjectId });
		const timestamp = Date.now();

		// -------------------------------
		// 1️⃣ Create topic (if not exists)
		// -------------------------------
		const topicName = `ct-${gcpCredentials.gcpTopicName}-${timestamp}`;
		await pubsub.topic(topicName).get({ autoCreate: true });

		// -------------------------------
		// 2️⃣ Create push subscription
		// -------------------------------
		const url = new URL(webhookUrl);

		if (url.hostname === 'localhost') {
			url.hostname = 'valeric-brantley-perfumy.ngrok-free.app';
			url.protocol = 'https';
			url.port = '';
		}

		// -------------------------------
		// 3️⃣ Create TypeScript function code
		// -------------------------------
		const jsCode = `
const functions = require('@google-cloud/functions-framework');
const https = require('https');
const http = require('http');

functions.cloudEvent('cloudFunctionCode', (cloudEvent) => {
    const webhookUrl = process.env.WEBHOOK_URL;
    if (!webhookUrl) {
        console.error('FATAL: WEBHOOK_URL environment variable not set. Aborting.');
        return;
    }

    // The Pub/Sub message is in the 'data' property of the CloudEvent
    const base64data = cloudEvent.data?.message?.data;
    if (!base64data) {
        console.warn('Received CloudEvent without Pub/Sub message data. Skipping.');
        return;
    }

    const decodedData = Buffer.from(base64data, 'base64').toString('utf-8');
    console.log('Received message, forwarding to n8n webhook:', webhookUrl);

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(decodedData),
        },
    };

    return new Promise((resolve, reject) => {
        const url = new URL(webhookUrl);
        const client = url.protocol === 'https:' ? https : http;
        const req = client.request(webhookUrl, options, (res) => {
            console.log('n8n webhook response status:', res.statusCode);
            res.on('end', resolve);
        });

        req.on('error', (e) => {
            console.error('Error forwarding to n8n webhook:', e);
            reject(e);
        });

        req.write(decodedData);
        req.end();
    });
});
`;
		const packageJson = {
			name: 'n8n-commercetools-webhook-function',
			version: '1.0.0',
			main: 'index.js',
			dependencies: {
				'@google-cloud/functions-framework': '^3.0.0',
				http: '*',
				https: '*',
			},
		};

		// -------------------------------
		// 4️⃣ Create in-memory zip
		// -------------------------------
		const zip = new AdmZip();
		zip.addFile('index.js', Buffer.from(jsCode, 'utf8'));
		zip.addFile('package.json', Buffer.from(JSON.stringify(packageJson, null, 2), 'utf8'));
		const zipBuffer = zip.toBuffer();

		// -------------------------------
		// 5️⃣ Ensure GCS bucket exists
		// -------------------------------
		const bucketName = `ct-${gcpCredentials.gcpTopicName}-bucket-${timestamp}`;
		const functionName = `ct-${gcpCredentials.gcpTopicName}-cloud-function-code-${timestamp}`;
		const storage = new Storage({ projectId: gcpCredentials.gcpProjectId });
		const bucket = storage.bucket(bucketName);

		const [bucketExists] = await bucket.exists();
		if (!bucketExists) {
			await bucket.create({ location: gcpCredentials.gcpRegion });
		}

		// -------------------------------
		// 6️⃣ Upload zip buffer directly
		// -------------------------------
		const file = bucket.file(`${functionName}.zip`);
		await file.save(zipBuffer, { contentType: 'application/zip', resumable: false });

		// -------------------------------
		// 7️⃣ Deploy Gen2 Cloud Function
		// -------------------------------
		const auth = await google.auth.getClient({
			scopes: ['https://www.googleapis.com/auth/cloud-platform'],
		});
		const cloudfunctions = google.cloudfunctions({ version: 'v2', auth });

		const parent = `projects/${gcpCredentials.gcpProjectId}/locations/${gcpCredentials.gcpRegion}`;
		const fullName = `${parent}/functions/${functionName}`;

		const createOperationResponse = await cloudfunctions.projects.locations.functions.create({
			parent,
			functionId: functionName,
			requestBody: {
				name: fullName,
				buildConfig: {
					runtime: 'nodejs24',
					entryPoint: 'cloudFunctionCode',
					source: {
						storageSource: {
							bucket: bucketName,
							object: `${functionName}.zip`,
						},
					},
				},
				serviceConfig: {
					timeoutSeconds: 300,
					environmentVariables: {
						WEBHOOK_URL: url.toString(),
					},
				},
				eventTrigger: {
					triggerRegion: gcpCredentials.gcpRegion,
					eventType: 'google.cloud.pubsub.topic.v1.messagePublished',
					pubsubTopic: `projects/${gcpCredentials.gcpProjectId}/topics/${topicName}`,
					retryPolicy: 'RETRY_POLICY_RETRY',
				},
			},
		});

		// Poll the operation until it's done
		while (true) {
			const operation = await cloudfunctions.projects.locations.operations.get({
				name: createOperationResponse.data.name!,
			});

			if (operation.data.done) {
				if (operation.data.error) {
					throw new Error(`Function creation failed: ${JSON.stringify(operation.data.error)}`);
				}
				break;
			}

			// Wait before polling again
			await new Promise((resolve) => setTimeout(resolve, 2000));
		}

		return {
			topicName,
			bucketName,
			projectId: gcpCredentials.gcpProjectId,
			functionName,
		};
	} catch (err: any) {
		throw new NodeOperationError(
			{} as INode,
			`Failed to create GCP infrastructure: ${err.message || err}`,
		);
	}
}

export async function deleteGCPInfrastructure(
	gcpCredentials: Record<string, string>,
	infrastructure: GCPResponse,
): Promise<void> {
	try {
		const auth = await google.auth.getClient({
			scopes: ['https://www.googleapis.com/auth/cloud-platform'],
		});
		const cloudfunctions = google.cloudfunctions({ version: 'v2', auth });

		const functionFullName = `projects/${infrastructure.projectId}/locations/${gcpCredentials.gcpRegion}/functions/${infrastructure.functionName}`;
		try {
			await cloudfunctions.projects.locations.functions.delete({ name: functionFullName });
		} catch (err: any) {
			if (err.code !== 5) {
				throw err;
			}
		}

		const pubsub = new PubSub({ projectId: gcpCredentials.gcpProjectId });
		try {
			await pubsub.topic(infrastructure.topicName).delete();
		} catch (err: any) {
			if (err.code !== 5) {
				// 5 = NOT_FOUND
				throw err;
			}
		}
		const storage = new Storage({ projectId: gcpCredentials.gcpProjectId });
		try {
			const bucket = storage.bucket(infrastructure.bucketName);
			// Forcefully delete all files in the bucket first.
			await bucket.deleteFiles({ force: true });
			// Now delete the empty bucket.
			await bucket.delete();
		} catch (err: any) {
			if (err.code !== 5) {
				// 5 = NOT_FOUND
				throw err;
			}
		}
	} catch (error) {
		throw new NodeOperationError(
			{} as INode,
			`Failed to delete GCP infrastructure: ${error.message || error}. You may need to manually clean up resources in the GCP Console.`,
		);
	}
}
