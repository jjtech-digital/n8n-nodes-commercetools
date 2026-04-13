import type { INodeProperties } from 'n8n-workflow';
import type { ParsedOperation } from './collection/types';
import { generateResourceProperty, generateOperationProperties, generateVersionField } from './properties/resourceAndOperation';
import { generateIdFields } from './properties/idFields';
import { generateActionsJsonField, generateActionsUiField } from './properties/versionAndActions';
import { generateCreateBodyFields, generateMiscPostBodyFields, generateSearchBodyFields } from './properties/bodyFields';
import { generateImageUploadFields, generateQueryParamProperties } from './properties/imageAndQuery';
export { generateResourceProperty, generateOperationProperties, generateVersionField, generateIdFields, generateActionsJsonField, generateActionsUiField, generateCreateBodyFields, generateMiscPostBodyFields, generateSearchBodyFields, generateImageUploadFields, generateQueryParamProperties, };
export declare function generateAllNodeProperties(operations: ParsedOperation[], folders: string[]): INodeProperties[];
