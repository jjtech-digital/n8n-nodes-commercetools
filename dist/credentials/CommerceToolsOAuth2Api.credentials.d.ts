import type { ICredentialType, INodeProperties, Icon } from 'n8n-workflow';
export declare class CommerceToolsOAuth2Api implements ICredentialType {
    name: string;
    extends: string[];
    displayName: string;
    icon: Icon;
    documentationUrl: string;
    properties: INodeProperties[];
}
