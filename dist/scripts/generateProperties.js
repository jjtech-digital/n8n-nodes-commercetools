"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateQueryParamProperties = exports.generateImageUploadFields = exports.generateSearchBodyFields = exports.generateMiscPostBodyFields = exports.generateCreateBodyFields = exports.generateActionsUiField = exports.generateActionsJsonField = exports.generateIdFields = exports.generateVersionField = exports.generateOperationProperties = exports.generateResourceProperty = void 0;
exports.generateAllNodeProperties = generateAllNodeProperties;
const resourceAndOperation_1 = require("./properties/resourceAndOperation");
Object.defineProperty(exports, "generateResourceProperty", { enumerable: true, get: function () { return resourceAndOperation_1.generateResourceProperty; } });
Object.defineProperty(exports, "generateOperationProperties", { enumerable: true, get: function () { return resourceAndOperation_1.generateOperationProperties; } });
Object.defineProperty(exports, "generateVersionField", { enumerable: true, get: function () { return resourceAndOperation_1.generateVersionField; } });
const idFields_1 = require("./properties/idFields");
Object.defineProperty(exports, "generateIdFields", { enumerable: true, get: function () { return idFields_1.generateIdFields; } });
const versionAndActions_1 = require("./properties/versionAndActions");
Object.defineProperty(exports, "generateActionsJsonField", { enumerable: true, get: function () { return versionAndActions_1.generateActionsJsonField; } });
Object.defineProperty(exports, "generateActionsUiField", { enumerable: true, get: function () { return versionAndActions_1.generateActionsUiField; } });
const bodyFields_1 = require("./properties/bodyFields");
Object.defineProperty(exports, "generateCreateBodyFields", { enumerable: true, get: function () { return bodyFields_1.generateCreateBodyFields; } });
Object.defineProperty(exports, "generateMiscPostBodyFields", { enumerable: true, get: function () { return bodyFields_1.generateMiscPostBodyFields; } });
Object.defineProperty(exports, "generateSearchBodyFields", { enumerable: true, get: function () { return bodyFields_1.generateSearchBodyFields; } });
const imageAndQuery_1 = require("./properties/imageAndQuery");
Object.defineProperty(exports, "generateImageUploadFields", { enumerable: true, get: function () { return imageAndQuery_1.generateImageUploadFields; } });
Object.defineProperty(exports, "generateQueryParamProperties", { enumerable: true, get: function () { return imageAndQuery_1.generateQueryParamProperties; } });
function buildFolderIndex(operations, folders) {
    const map = new Map(folders.map((f) => [f, []]));
    for (const op of operations) {
        if (map.has(op.folder)) {
            map.get(op.folder).push(op);
        }
    }
    return map;
}
function generateAllNodeProperties(operations, folders) {
    const byFolder = buildFolderIndex(operations, folders);
    return [
        (0, resourceAndOperation_1.generateResourceProperty)(folders),
        ...(0, resourceAndOperation_1.generateOperationProperties)(byFolder, folders),
        ...(0, idFields_1.generateIdFields)(byFolder, folders),
        ...(0, resourceAndOperation_1.generateVersionField)(byFolder, folders),
        ...(0, versionAndActions_1.generateActionsJsonField)(byFolder, folders),
        ...(0, versionAndActions_1.generateActionsUiField)(byFolder, folders),
        ...(0, bodyFields_1.generateCreateBodyFields)(byFolder, folders),
        ...(0, bodyFields_1.generateMiscPostBodyFields)(byFolder, folders),
        ...(0, bodyFields_1.generateSearchBodyFields)(byFolder, folders),
        ...(0, imageAndQuery_1.generateImageUploadFields)(byFolder, folders),
        ...(0, imageAndQuery_1.generateQueryParamProperties)(byFolder, folders),
    ];
}
//# sourceMappingURL=generateProperties.js.map