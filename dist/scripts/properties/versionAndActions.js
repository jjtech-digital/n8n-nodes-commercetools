"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateActionsJsonField = generateActionsJsonField;
exports.generateActionsUiField = generateActionsUiField;
const helpers_1 = require("./helpers");
const operationUtils_1 = require("../operationUtils");
function generateActionsJsonField(opsByFolder, folders) {
    var _a;
    const props = [];
    for (const folder of folders) {
        const resourceValue = (0, helpers_1.slugify)(folder);
        const mainUpdateOps = ((_a = opsByFolder.get(folder)) !== null && _a !== void 0 ? _a : [])
            .filter((op) => (0, operationUtils_1.isMainUpdateOp)(op))
            .map((op) => op.value);
        if (mainUpdateOps.length === 0)
            continue;
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
function generateActionsUiField(opsByFolder, folders) {
    var _a;
    const props = [];
    for (const folder of folders) {
        const resourceValue = (0, helpers_1.slugify)(folder);
        const folderOps = (_a = opsByFolder.get(folder)) !== null && _a !== void 0 ? _a : [];
        const mainUpdateOps = folderOps.filter((op) => (0, operationUtils_1.isMainUpdateOp)(op)).map((op) => op.value);
        if (mainUpdateOps.length === 0)
            continue;
        const updateActions = folderOps.filter((op) => op.isUpdateAction);
        if (updateActions.length === 0)
            continue;
        const optionGroups = updateActions.map((op) => {
            const actionFields = [];
            const fields = op.actionBodyFields;
            if (fields.length > 0) {
                for (const field of fields) {
                    actionFields.push((0, helpers_1.makeActionFieldProperty)(field.name, field));
                }
            }
            else {
                actionFields.push({
                    displayName: 'No additional parameters required for this action.',
                    name: '_notice',
                    type: 'notice',
                    default: '',
                });
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
//# sourceMappingURL=versionAndActions.js.map