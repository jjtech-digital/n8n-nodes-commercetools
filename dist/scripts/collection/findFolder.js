"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findFolder = findFolder;
let cachedItems = null;
const folderCache = new Map();
function buildIndex(items, prefix = '') {
    for (const item of items) {
        if (!Array.isArray(item.item))
            continue;
        const key = prefix ? `${prefix}/${item.name}` : item.name;
        folderCache.set(key, item);
        buildIndex(item.item, key);
    }
}
function getSearchRoot(items, projectFolderName) {
    const projectFolder = items.find((i) => i.name === projectFolderName && Array.isArray(i.item));
    return projectFolder ? projectFolder.item : items;
}
function findFolder(items, folderName, projectFolderName = 'Project') {
    var _a, _b, _c;
    if (items !== cachedItems) {
        folderCache.clear();
        const searchRoot = getSearchRoot(items, projectFolderName);
        buildIndex(searchRoot);
        cachedItems = items;
    }
    if (folderCache.has(folderName))
        return (_a = folderCache.get(folderName)) !== null && _a !== void 0 ? _a : null;
    const lastSegment = (_b = folderName.split('/').pop()) !== null && _b !== void 0 ? _b : folderName;
    return (_c = folderCache.get(lastSegment)) !== null && _c !== void 0 ? _c : null;
}
//# sourceMappingURL=findFolder.js.map