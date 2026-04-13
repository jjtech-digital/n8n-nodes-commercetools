/**
 * scripts/properties/resourceAndOperation.ts
 *
 * Generators for:
 *   1. Resource dropdown
 *   2. Operation dropdowns (per-resource)
 *   3. Version field
 */

import type { INodeProperties } from 'n8n-workflow';
import type { ParsedOperation } from '../collection/types';
import { slugify, toSingular } from './helpers';
import { isMainUpdateOp } from '../operationUtils';

// ─── 1. Resource dropdown ─────────────────────────────────────────────────────

/**
 * BUG-8: Guard against empty folders array (was crashing with slugify(folders[0])).
 */
export function generateResourceProperty(folders: string[]): INodeProperties {
	return {
		displayName: 'Resource',
		name: 'resource',
		type: 'options',
		noDataExpression: true,
		options: folders.map((f) => ({
			name: toSingular(f),
			value: slugify(f),
		})),
		default: folders.length ? slugify(folders[0]) : '',
	};
}

// ─── 2. Operation dropdowns ───────────────────────────────────────────────────

export function generateOperationProperties(
	opsByFolder: Map<string, ParsedOperation[]>,
	folders: string[],
): INodeProperties[] {
	const props: INodeProperties[] = [];

	for (const folder of folders) {
		const resourceValue = slugify(folder);
		const topLevelOps = (opsByFolder.get(folder) ?? []).filter((op) => !op.isUpdateAction);
		if (topLevelOps.length === 0) continue;

		props.push({
			displayName: 'Operation',
			name: 'operation',
			type: 'options',
			noDataExpression: true,
			displayOptions: { show: { resource: [resourceValue] } },
			options: topLevelOps.map((op) => ({
				name: op.name,
				value: op.value,
				action: op.name,
			})),
			default: topLevelOps[0].value,
		});
	}

	return props;
}

// ─── 3. Version field ─────────────────────────────────────────────────────────

export function generateVersionField(
	opsByFolder: Map<string, ParsedOperation[]>,
	folders: string[],
): INodeProperties[] {
	const props: INodeProperties[] = [];

	for (const folder of folders) {
		const resourceValue = slugify(folder);
		const opsNeedingVersion = (opsByFolder.get(folder) ?? [])
			.filter((op) => !op.isUpdateAction && (isMainUpdateOp(op) || op.method === 'DELETE'))
			.map((op) => op.value);

		if (opsNeedingVersion.length === 0) continue;

		props.push({
			displayName: 'Version',
			name: 'version',
			type: 'number',
			default: 1,
			required: true,
			displayOptions: { show: { resource: [resourceValue], operation: opsNeedingVersion } },
		});
	}

	return props;
}
