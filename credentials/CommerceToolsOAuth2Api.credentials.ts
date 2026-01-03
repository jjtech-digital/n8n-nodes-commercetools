import type { ICredentialType, INodeProperties, Icon } from 'n8n-workflow';

export class CommerceToolsOAuth2Api implements ICredentialType {
	name = 'commerceToolsOAuth2Api';

	extends = ['oAuth2Api'];

	displayName = 'CommerceTools OAuth2 API';

	icon: Icon = 'file:../icons/Commercetools.svg';

	documentationUrl = 'https://docs.commercetools.com/api/authorization';

	properties: INodeProperties[] = [
		{
			displayName: 'Project Key',
			name: 'projectKey',
			type: 'string',
			default: '',
			placeholder: 'your-project-key',
			description: 'The project key from CommerceTools',
			required: true,
		},
		{
			displayName: 'Region',
			name: 'region',
			type: 'options',
			options: [
				{
					name: 'Australia (Southeast 1)',
					value: 'australia-southeast1.gcp',
				},
				{
					name: 'Europe (West)',
					value: 'europe-west1.gcp',
				},
				{
					name: 'North America (US Central)',
					value: 'us-central1.gcp',
				},
			],
			default: 'australia-southeast1.gcp',
			description:
				'Region-specific auth host; determines the OAuth token endpoint used for client credentials grants',
		},
		{
			displayName: 'AWS Client ID',
			name: 'awsAccessKeyId',
			type: 'string',
			default: '',
			placeholder: 'your-aws-client-id',
			description: 'AWS Client ID for authentication',
			required: true,
		},
		{
			displayName: 'AWS Client Secret',
			name: 'awsSecretAccessKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			placeholder: 'your-aws-client-secret',
			description: 'AWS Client Secret for authentication',
			required: true,
		},
		{
			displayName: 'Grant Type',
			name: 'grantType',
			type: 'hidden',
			default: 'clientCredentials',
		},
		{
			displayName: 'Authorization URL',
			name: 'authUrl',
			type: 'hidden',
			default: '',
		},
		{
			displayName: 'Access Token URL',
			name: 'accessTokenUrl',
			type: 'hidden',
			default: 'https://auth.australia-southeast1.gcp.commercetools.com/oauth/token',
			required: true,
		},
		{
			displayName: 'Auth URI Query Parameters',
			name: 'authQueryParameters',
			type: 'hidden',
			default: 'grant_type=client_credentials',
		},
		{
			displayName: 'Authentication',
			name: 'authentication',
			type: 'hidden',
			default: 'header',
		},
	];
}