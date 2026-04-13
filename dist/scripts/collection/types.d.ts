export interface BodyField {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'json';
    required: boolean;
    example: unknown;
    description: string;
}
export interface ParsedOperation {
    name: string;
    value: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD';
    urlTemplate: string;
    bodyFields: BodyField[];
    actionBodyFields: BodyField[];
    queryParams: string[];
    description: string;
    folder: string;
    subFolder: string;
    isUpdateAction: boolean;
    requiresId: boolean;
    requiresKey: boolean;
    requiresVersion: boolean;
    pathParamLabel?: string;
    pathParamName?: string;
    pathParamSegment?: string;
    keyPlaceholder?: string;
    isSearch?: boolean;
    isImageUpload?: boolean;
    secondaryIdPlaceholder?: string;
    associateIdPlaceholder?: string;
    storeKeyPlaceholder?: string;
}
