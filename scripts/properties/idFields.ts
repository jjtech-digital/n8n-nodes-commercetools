/**
 * scripts/properties/idFields.ts
 *
 * Generates ID, Key, Container, secondary-ID, associate-ID, store-key, and
 * tertiary-key fields for all resource folders.
 *
 * GEN-BP-1: Each operation's key-match regex is computed once and carried
 * through — no double matchAll per operation.
 */

import type { INodeProperties } from 'n8n-workflow';
import type { ParsedOperation } from '../collection/types';
import { slugify, toSingular, placeholderToLabel } from './helpers';

export function generateIdFields(
	opsByFolder: Map<string, ParsedOperation[]>,
	folders: string[],
): INodeProperties[] {
	const props: INodeProperties[] = [];

	for (const folder of folders) {
		const resourceValue = slugify(folder);
		const singular = toSingular(folder);
		const topLevelOps = (opsByFolder.get(folder) ?? []).filter((op) => !op.isUpdateAction);

		// ── Standard ID field ──────────────────────────────────────────────
		const opsNeedingId = topLevelOps
			.filter((op) => op.requiresId && !op.requiresKey && !op.pathParamName)
			.map((op) => op.value);
		if (opsNeedingId.length > 0) {
			props.push({
				displayName: `${singular} ID`,
				name: 'resourceId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: { show: { resource: [resourceValue], operation: opsNeedingId } },
			});
		}

		// ── Standard Key field ─────────────────────────────────────────────
		const opsNeedingKey = topLevelOps
			.filter((op) => op.requiresKey && !op.pathParamName)
			.map((op) => op.value);
		if (opsNeedingKey.length > 0) {
			props.push({
				displayName: `${singular} Key`,
				name: 'resourceKey',
				type: 'string',
				default: '',
				required: true,
				displayOptions: { show: { resource: [resourceValue], operation: opsNeedingKey } },
			});
		}

		// ── Custom Object container/key ────────────────────────────────────
		const containerOps = topLevelOps
			.filter((op) => op.urlTemplate.includes('{{container}}'))
			.map((op) => op.value);
		if (containerOps.length > 0) {
			props.push({
				displayName: 'Container',
				name: 'container',
				type: 'string',
				default: '',
				required: true,
				displayOptions: { show: { resource: [resourceValue], operation: containerOps } },
			});
		}
		const customKeyOps = topLevelOps
			.filter((op) => op.urlTemplate.includes('{{custom-object-key}}'))
			.map((op) => op.value);
		if (customKeyOps.length > 0) {
			props.push({
				displayName: 'Key',
				name: 'resourceKey',
				type: 'string',
				default: '',
				required: true,
				displayOptions: { show: { resource: [resourceValue], operation: customKeyOps } },
			});
		}

		// ── Custom path params (non-key) ───────────────────────────────────
		const byParamName = new Map<string, { label: string; opValues: string[] }>();
		for (const op of topLevelOps.filter((op) => op.requiresId && op.pathParamName)) {
			const key = op.pathParamName!;
			if (!byParamName.has(key)) byParamName.set(key, { label: op.pathParamLabel!, opValues: [] });
			byParamName.get(key)!.opValues.push(op.value);
		}
		for (const [paramName, { label, opValues }] of byParamName) {
			props.push({
				displayName: label,
				name: paramName,
				type: 'string',
				default: '',
				required: true,
				displayOptions: { show: { resource: [resourceValue], operation: opValues } },
			});
		}

		// ── Secondary ID ───────────────────────────────────────────────────
		const bySecondaryPlaceholder = new Map<string, string[]>();
		for (const op of topLevelOps.filter((op) => op.secondaryIdPlaceholder)) {
			const ph = op.secondaryIdPlaceholder!;
			if (!bySecondaryPlaceholder.has(ph)) bySecondaryPlaceholder.set(ph, []);
			bySecondaryPlaceholder.get(ph)!.push(op.value);
		}
		for (const [placeholder, opValues] of bySecondaryPlaceholder) {
			props.push({
				displayName: placeholderToLabel(placeholder, 'ID'),
				name: 'secondaryId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: { show: { resource: [resourceValue], operation: opValues } },
			});
		}

		// ── Associate ID ───────────────────────────────────────────────────
		const associateOps = topLevelOps
			.filter((op) => op.associateIdPlaceholder)
			.map((op) => op.value);
		if (associateOps.length > 0) {
			props.push({
				displayName: 'Associate ID',
				name: 'associateId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: { show: { resource: [resourceValue], operation: associateOps } },
			});
		}

		// ── Store Key ──────────────────────────────────────────────────────
		const storeKeyOps = topLevelOps.filter((op) => op.storeKeyPlaceholder).map((op) => op.value);
		if (storeKeyOps.length > 0) {
			props.push({
				displayName: 'Store Key',
				name: 'storeKey',
				type: 'string',
				default: '',
				required: true,
				displayOptions: { show: { resource: [resourceValue], operation: storeKeyOps } },
			});
		}

		// ── Tertiary Key (two key= segments in URL) ────────────────────────
		// GEN-BP-1: compute matchAll once per op, carry result through both filter and map
		type TertiaryEntry = { op: ParsedOperation; tertiaryKeyPlaceholder: string };
		const tertiaryEntries: TertiaryEntry[] = topLevelOps
			.map((op) => {
				const keyMatches = [...op.urlTemplate.matchAll(/key=\{\{([^}]+)\}\}/g)].map((m) => m[1]);
				return keyMatches.length >= 2
					? { op, tertiaryKeyPlaceholder: keyMatches[1] }
					: null;
			})
			.filter(Boolean) as TertiaryEntry[];

		const byTertiaryKey = new Map<string, string[]>();
		for (const { op, tertiaryKeyPlaceholder } of tertiaryEntries) {
			if (!byTertiaryKey.has(tertiaryKeyPlaceholder)) byTertiaryKey.set(tertiaryKeyPlaceholder, []);
			byTertiaryKey.get(tertiaryKeyPlaceholder)!.push(op.value);
		}
		for (const [placeholder, opValues] of byTertiaryKey) {
			props.push({
				displayName: placeholderToLabel(placeholder, 'Key'),
				name: 'tertiaryKey',
				type: 'string',
				default: '',
				required: true,
				displayOptions: { show: { resource: [resourceValue], operation: opValues } },
			});
		}
	}

	return props;
}
