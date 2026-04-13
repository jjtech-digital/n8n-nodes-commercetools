"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.slugify = slugify;
exports.formatLabel = formatLabel;
exports.isLocalizedObject = isLocalizedObject;
exports.isUpdateActionsSubFolder = isUpdateActionsSubFolder;
function slugify(name) {
    return name
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .trim()
        .split(/\s+/)
        .map((w, i) => (i === 0 ? w.toLowerCase() : w[0].toUpperCase() + w.slice(1).toLowerCase()))
        .join('');
}
function formatLabel(dotPath) {
    return dotPath
        .split('.')
        .map((s) => s.replace(/([A-Z])/g, ' $1').trim())
        .join(' › ')
        .replace(/^./, (c) => c.toUpperCase());
}
function isLocalizedObject(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value))
        return false;
    const keys = Object.keys(value);
    if (keys.length === 0)
        return false;
    return keys.every((k) => /^[a-z]{2}(-[A-Z]{2})?$/.test(k));
}
function isUpdateActionsSubFolder(folderName) {
    return /\bactions?$/i.test(folderName.trim());
}
//# sourceMappingURL=helpers.js.map