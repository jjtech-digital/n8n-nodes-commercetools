/**
 * CommerceToolsOAuth2Api.credentials.ts
 *
 * Credentials definition for the commercetools node.
 * Uses OAuth2 client credentials flow with project key + region.
 *
 * The authUrl and accessTokenUrl are dynamically built from the selected region,
 * so switching region in the UI automatically updates the token endpoint.
 */

import type { ICredentialType, INodeProperties, Icon } from 'n8n-workflow';

export class CommerceToolsOAuth2Api implements ICredentialType {
	name = 'commerceToolsOAuth2Api';

	extends = ['oAuth2Api'];

	// eslint-disable-next-line n8n-nodes-base/cred-class-field-display-name-miscased
	displayName = 'commercetools OAuth2 API';

	icon: Icon = 'file:../icons/Commercetools.svg';

	documentationUrl = 'https://docs.commercetools.com/api/authorization';

	properties: INodeProperties[] = [
		// ── commercetools core credentials ────────────────────────────────────
		{
			displayName: 'Project Key',
			name: 'projectKey',
			type: 'string',
			default: '',
			placeholder: 'your-project-key',
			description: 'The project key from commercetools Merchant Center',
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
				'The commercetools region. Determines both the OAuth token endpoint and the API base URL.',
		},

		// ── AWS credentials (optional — for SQS/SNS subscription destinations) ─
		{
			displayName: 'AWS Client Access Key',
			name: 'awsAccessKeyId',
			type: 'string',
			default: '',
			placeholder: 'your-aws-client-id',
			description:
				'AWS Access Key ID — only needed when using AWS SQS/SNS as subscription destination',
		},
		{
			displayName: 'AWS Client Secret',
			name: 'awsSecretAccessKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			placeholder: 'your-aws-client-secret',
			description:
				'AWS Secret Access Key — only needed when using AWS SQS/SNS as subscription destination',
		},
		{
			displayName: 'AWS Region',
			name: 'awsRegion',
			type: 'string',
			default: 'us-east-1',
			placeholder: 'us-east-1',
			description: 'AWS Region — only needed when using AWS SQS/SNS as subscription destination',
		},

		// ── OAuth2 hidden fields — auto-computed from region selection ────────
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
			// Dynamically uses the selected region value
			default: '={{ `https://auth.${$self["region"]}.commercetools.com` }}',
		},
		{
			displayName: 'Access Token URL',
			name: 'accessTokenUrl',
			type: 'hidden',
			default: '={{ `https://auth.${$self["region"]}.commercetools.com/oauth/token` }}',
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
