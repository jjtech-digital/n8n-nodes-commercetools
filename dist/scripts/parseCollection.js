"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.slugify = void 0;
exports.parseCollection = parseCollection;
var helpers_1 = require("./collection/helpers");
Object.defineProperty(exports, "slugify", { enumerable: true, get: function () { return helpers_1.slugify; } });
const findFolder_1 = require("./collection/findFolder");
const walkItems_1 = require("./collection/walkItems");
function parseCollection(collection, folders) {
    const operations = [];
    for (const folderName of folders) {
        const folder = (0, findFolder_1.findFolder)(collection.item, folderName);
        if (!(folder === null || folder === void 0 ? void 0 : folder.item))
            continue;
        (0, walkItems_1.walkItems)(folder.item, operations, folderName, '', false);
    }
    return operations;
}
//# sourceMappingURL=parseCollection.js.map