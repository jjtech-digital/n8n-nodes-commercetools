/**
 * nodes/Commercetools/utils/gcpDelete.utils.ts
 *
 * Deletes all GCP resources previously provisioned by gcpInfra.utils.ts:
 *   - Cloud Function (Gen2)
 *   - Pub/Sub topic
 *   - GCS bucket (files deleted first, then bucket)
 *
 * Extracted from gcpInfra.utils.ts to keep each file under 300 lines.
 *
 * GCP-BUG-2 FIX: deletion uses `infrastructure.region` (the region recorded
 *                 at creation time) rather than `credentials.gcpRegion` (the
 *                 current credential value, which may have changed).
 */

import type { INode } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { PubSub } from '@google-cloud/pubsub';
import { Storage } from '@google-cloud/storage';
import { google } from 'googleapis';
import { buildAuthClient, parseCredentials } from './gcpInfra.utils';
import type { GCPResponse } from './gcpInfra.utils';

export async function deleteGCPInfrastructure(
	gcpCredentials: Record<string, string>,
	infrastructure: GCPResponse,
	node?: INode,
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

		// GCP-BUG-2: use infrastructure.region (set at creation), not credentials.gcpRegion
		const region = infrastructure.region ?? gcpCredentials.gcpRegion;

		// Delete all three resources in parallel — failures in one don't block others
		const results = await Promise.allSettled([
			// Cloud Function
			cloudfunctions.projects.locations.functions
				.delete({
					name: `projects/${infrastructure.projectId}/locations/${region}/functions/${infrastructure.functionName}`,
				})
				.catch((err: unknown) => {
					const code = (err as { code?: number }).code;
					if (code !== 5 && code !== 404) throw err; // NOT_FOUND is fine
				}),

			// Pub/Sub topic
			pubsub
				.topic(infrastructure.topicName)
				.delete()
				.catch((err: unknown) => {
					const code = (err as { code?: number }).code;
					if (code !== 5 && code !== 404) throw err;
				}),

			// GCS bucket — files must be deleted before the bucket itself
			(async () => {
				const bucket = storage.bucket(infrastructure.bucketName);
				await bucket.deleteFiles({ force: true });
				await bucket.delete();
			})().catch((err: unknown) => {
				const code = (err as { code?: number }).code;
				if (code !== 5 && code !== 404) throw err;
			}),
		]);

		const failed = results.filter((r) => r.status === 'rejected') as PromiseRejectedResult[];
		if (failed.length) {
			const msgs = failed.map((f) => (f.reason as Error)?.message ?? String(f.reason)).join('; ');
			throw new Error(msgs);
		}
	} catch (error) {
		const msg = error instanceof Error ? error.message : String(error);
		throw new NodeOperationError(
			node ?? ({} as INode),
			`Failed to delete GCP infrastructure: ${msg}. You may need to manually clean up in GCP Console.`,
		);
	}
}
