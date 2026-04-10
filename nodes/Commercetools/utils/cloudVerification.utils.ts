/**
 * nodes/Commercetools/utils/cloudVerification.utils.ts
 *
 * Verifies that previously provisioned AWS and GCP cloud infrastructure
 * still exists. Extracted from webhookMethods.utils.ts to keep that file
 * under 300 lines and to allow verification logic to be tested independently.
 *
 * WEBHOOK-READ-1: verification sub-functions extracted here.
 * WEBHOOK-READ-2: GCP SDK imports are in this file only — webhookMethods no
 *                 longer pulls in the heavy @google-cloud/* modules at module
 *                 load time.
 */

import type { AWSResponse } from './awsInfra.utils';
import type { GCPResponse } from './gcpInfra.utils';
import { buildAuthClient, parseCredentials } from './gcpInfra.utils';

// ─── AWS verification ─────────────────────────────────────────────────────────

/**
 * Verify that the Lambda function and SQS queue referenced in `infra` still
 * exist and are accessible.
 *
 * Returns true when both resources are present; false when either is gone or
 * the credentials are rejected.
 */
export async function verifyAWSInfrastructure(
	credentials: Record<string, string>,
	infra: AWSResponse,
): Promise<boolean> {
	// Lazy imports — only loaded when AWS infra is in use
	const { LambdaClient, GetFunctionConfigurationCommand } = await import('@aws-sdk/client-lambda');
	const { SQSClient, GetQueueAttributesCommand } = await import('@aws-sdk/client-sqs');

	const clientConfig = {
		credentials: {
			accessKeyId: credentials.awsAccessKeyId,
			secretAccessKey: credentials.awsSecretAccessKey,
		},
		region: infra.region ?? 'us-east-1',
	};

	try {
		const lambda = new LambdaClient(clientConfig);
		const sqs = new SQSClient(clientConfig);

		await lambda.send(
			new GetFunctionConfigurationCommand({ FunctionName: infra.lambdaFunctionName as string }),
		);

		await sqs.send(
			new GetQueueAttributesCommand({
				QueueUrl: infra.queueUrl as string,
				AttributeNames: ['ApproximateNumberOfMessages'],
			}),
		);

		return true;
	} catch {
		return false;
	}
}

// ─── GCP verification ─────────────────────────────────────────────────────────

/**
 * Verify that the Cloud Function, Pub/Sub topic, and GCS bucket referenced
 * in `infra` all still exist.
 *
 * Returns true when all three are present; false when any is gone.
 */
export async function verifyGCPInfrastructure(
	credentials: Record<string, string>,
	infra: GCPResponse,
): Promise<boolean> {
	// Lazy imports — only loaded when GCP infra is in use (WEBHOOK-READ-2)
	const { PubSub } = await import('@google-cloud/pubsub');
	const { Storage } = await import('@google-cloud/storage');
	const { google } = await import('googleapis');

	try {
		const creds = parseCredentials(credentials);
		const { restAuth } = await buildAuthClient(credentials);

		// ── Cloud Function ────────────────────────────────────────────────────
		const cloudfunctions = google.cloudfunctions({ version: 'v2', auth: restAuth });
		const fnFullName = `projects/${infra.projectId}/locations/${credentials.gcpRegion}/functions/${infra.functionName}`;
		try {
			await cloudfunctions.projects.locations.functions.get({ name: fnFullName });
		} catch (err) {
			// gRPC NOT_FOUND = code 5; REST 404 = code 404
			const code = (err as { code?: number }).code;
			if (code === 5 || code === 404) return false;
			throw err;
		}

		// ── Pub/Sub topic ─────────────────────────────────────────────────────
		const pubsub = new PubSub({
			projectId: infra.projectId,
			credentials: { client_email: creds.clientEmail, private_key: creds.privateKey },
		});
		const [topicExists] = await pubsub.topic(infra.topicName).exists();
		if (!topicExists) return false;

		// ── GCS bucket ────────────────────────────────────────────────────────
		const storage = new Storage({
			projectId: infra.projectId,
			credentials: { client_email: creds.clientEmail, private_key: creds.privateKey },
		});
		const [bucketExists] = await storage.bucket(infra.bucketName).exists();
		return bucketExists;
	} catch {
		return false;
	}
}
