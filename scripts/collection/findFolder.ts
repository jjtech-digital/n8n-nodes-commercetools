/**
 * scripts/collection/findFolder.ts
 *
 * Locates a named folder inside a Postman Collection item tree.
 * Supports slash-delimited nested paths (e.g. 'As-associate/In-business-unit/Carts').
 *
 * PERF-5: A module-level index cache is built on first use so repeated calls
 * for the same collection do not re-scan the tree from scratch.
 */

import type { PostmanItem } from './postmanTypes';

// ─── Index cache ──────────────────────────────────────────────────────────────
// Keyed by the JSON identity of the top-level items array (object reference).
// Cleared automatically when a different collection object is passed.
let cachedItems: PostmanItem[] | null = null;
const folderCache = new Map<string, PostmanItem | null>();

function buildIndex(items: PostmanItem[], prefix = ''): void {
	for (const item of items) {
		if (!Array.isArray(item.item)) continue;
		const key = prefix ? `${prefix}/${item.name}` : item.name;
		folderCache.set(key, item);
		buildIndex(item.item, key);
	}
}

function getSearchRoot(items: PostmanItem[], projectFolderName: string): PostmanItem[] {
	const projectFolder = items.find((i) => i.name === projectFolderName && Array.isArray(i.item));
	return projectFolder ? projectFolder.item! : items;
}

// ─── Public ───────────────────────────────────────────────────────────────────

/**
 * Find a folder by name (or slash-delimited path) inside a Postman collection.
 * Returns null when not found.
 *
 * @param items           Top-level items array from the collection
 * @param folderName      Exact folder name or path ("Products" or "As-associate/In-business-unit/Carts")
 * @param projectFolderName  Wrapper folder name to unwrap first (default: "Project")
 */
export function findFolder(
	items: PostmanItem[],
	folderName: string,
	projectFolderName = 'Project',
): PostmanItem | null {
	// Rebuild index when collection object reference changes
	if (items !== cachedItems) {
		folderCache.clear();
		const searchRoot = getSearchRoot(items, projectFolderName);
		buildIndex(searchRoot);
		cachedItems = items;
	}

	// Direct cache hit — no tree traversal needed
	if (folderCache.has(folderName)) return folderCache.get(folderName) ?? null;

	// Try with the last segment only as a fallback (handles flat collections)
	const lastSegment = folderName.split('/').pop() ?? folderName;
	return folderCache.get(lastSegment) ?? null;
}
