/**
 * scripts/properties/versionAndActions.ts
 *
 * Generators for:
 *   - Actions (JSON) field
 *   - Actions (UI) fixedCollection
 */

import type { INodeProperties } from 'n8n-workflow';
import type { ParsedOperation } from '../collection/types';
import { slugify, makeActionFieldProperty } from './helpers';
import { isMainUpdateOp } from '../operationUtils';

// ─── Actions (JSON) ───────────────────────────────────────────────────────────

export function generateActionsJsonField(
	opsByFolder: Map<string, ParsedOperation[]>,
	folders: string[],
): INodeProperties[] {
	const props: INodeProperties[] = [];

	for (const folder of folders) {
		const resourceValue = slugify(folder);
		const mainUpdateOps = (opsByFolder.get(folder) ?? [])
			.filter((op) => isMainUpdateOp(op))
			.map((op) => op.value);

		if (mainUpdateOps.length === 0) continue;

		props.push({
			displayName: 'Actions (JSON)',
			name: `actionsJson__${resourceValue}`,
			type: 'json',
			default: '[]',
			description: 'Raw JSON array of actions. Overrides Actions (UI) when not empty.',
			displayOptions: { show: { resource: [resourceValue], operation: mainUpdateOps } },
		});
	}

	return props;
}

// ─── Actions (UI) fixedCollection ─────────────────────────────────────────────

export function generateActionsUiField(
	opsByFolder: Map<string, ParsedOperation[]>,
	folders: string[],
): INodeProperties[] {
	const props: INodeProperties[] = [];

	for (const folder of folders) {
		const resourceValue = slugify(folder);
		const folderOps = opsByFolder.get(folder) ?? [];

		const mainUpdateOps = folderOps.filter((op) => isMainUpdateOp(op)).map((op) => op.value);
		if (mainUpdateOps.length === 0) continue;

		const updateActions = folderOps.filter((op) => op.isUpdateAction);
		if (updateActions.length === 0) continue;

		const optionGroups = updateActions.map((op) => {
			const actionFields: INodeProperties[] = [];
			const fields = op.actionBodyFields;

			if (fields.length > 0) {
				for (const field of fields) {
					actionFields.push(makeActionFieldProperty(field.name, field));
				}
			} else {
				actionFields.push({
					displayName: 'No additional parameters required for this action.',
					name: '_notice',
					type: 'notice',
					default: '',
				} as INodeProperties);
			}

			return {
				displayName: op.name,
				name: op.value,
				values: actionFields,
			};
		});

		props.push({
			displayName: 'Actions (UI)',
			name: `actionsUi__${resourceValue}`,
			type: 'fixedCollection',
			typeOptions: { multipleValues: true },
			default: {},
			placeholder: 'Add Action',
			displayOptions: { show: { resource: [resourceValue], operation: mainUpdateOps } },
			options: optionGroups,
		});
	}

	return props;
}
