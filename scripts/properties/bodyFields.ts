/**
 * scripts/properties/bodyFields.ts
 *
 * Generators for:
 *   - Create body fields
 *   - Misc-POST body fields
 *   - Search body fields
 *
 * BP-6: Search fields now use the `body__search__` prefix (was `body__misc__`)
 *       to prevent silent name collisions when a resource has both a misc-POST
 *       and a search-POST operation with the same op.value.
 *
 * Note: Changing body__misc__ → body__search__ for search fields is a
 *       breaking change for existing n8n workflows using search operations.
 *       The runtime bodyBuilder.utils.ts is updated to match.
 */

import type { INodeProperties } from 'n8n-workflow';
import type { ParsedOperation } from '../collection/types';
import { slugify, makeFieldProperty } from './helpers';
import { isMainUpdateOp, isCreateOp } from '../operationUtils';

// ─── Create body fields ───────────────────────────────────────────────────────

export function generateCreateBodyFields(
	opsByFolder: Map<string, ParsedOperation[]>,
	folders: string[],
): INodeProperties[] {
	const props: INodeProperties[] = [];

	for (const folder of folders) {
		const resourceValue = slugify(folder);
		const createOps = (opsByFolder.get(folder) ?? []).filter(
			(op) => !op.isUpdateAction && isCreateOp(op),
		);

		for (const createOp of createOps) {
			for (const field of createOp.bodyFields) {
				if (field.name === 'version') continue;
				props.push(
					makeFieldProperty(
						`body__create__${resourceValue}__${createOp.value}__${field.name.replace(/\./g, '__')}`,
						field,
						{ show: { resource: [resourceValue], operation: [createOp.value] } },
					),
				);
			}
		}
	}

	return props;
}

// ─── Misc-POST body fields ────────────────────────────────────────────────────

export function generateMiscPostBodyFields(
	opsByFolder: Map<string, ParsedOperation[]>,
	folders: string[],
): INodeProperties[] {
	const props: INodeProperties[] = [];

	for (const folder of folders) {
		const resourceValue = slugify(folder);

		const miscPostOps = (opsByFolder.get(folder) ?? []).filter(
			(op) =>
				!op.isUpdateAction &&
				op.method === 'POST' &&
				!isCreateOp(op) &&
				!isMainUpdateOp(op) &&
				!op.isSearch &&
				!op.isImageUpload &&
				op.bodyFields.length > 0,
		);

		for (const op of miscPostOps) {
			for (const field of op.bodyFields) {
				props.push(
					makeFieldProperty(
						`body__misc__${resourceValue}__${op.value}__${field.name.replace(/\./g, '__')}`,
						field,
						{ show: { resource: [resourceValue], operation: [op.value] } },
					),
				);
			}
		}
	}

	return props;
}

// ─── Search body fields ───────────────────────────────────────────────────────

export function generateSearchBodyFields(
	opsByFolder: Map<string, ParsedOperation[]>,
	folders: string[],
): INodeProperties[] {
	const props: INodeProperties[] = [];

	for (const folder of folders) {
		const resourceValue = slugify(folder);

		const searchOps = (opsByFolder.get(folder) ?? []).filter(
			(op) => !op.isUpdateAction && op.isSearch,
		);

		for (const op of searchOps) {
			for (const field of op.bodyFields) {
				// BP-6: use body__search__ prefix to avoid collisions with body__misc__
				props.push(
					makeFieldProperty(
						`body__search__${resourceValue}__${op.value}__${field.name.replace(/\./g, '__')}`,
						field,
						{ show: { resource: [resourceValue], operation: [op.value] } },
					),
				);
			}
		}
	}

	return props;
}
