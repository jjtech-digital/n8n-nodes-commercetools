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
		{
			displayName: 'Event Provider',
			name: 'eventProvider',
			type: 'options',
			options: [
				{
					name: 'None',
					value: 'none',
				},
				{
					name: 'AWS EventBridge',
					value: 'aws',
				},
				{
					name: 'Google Cloud Pub/Sub',
					value: 'gcp',
				},
			],
			default: 'none',
			description: 'Choose the event provider for webhook integration',
		},
		{
			displayName: 'AWS Client Access Key',
			name: 'awsAccessKeyId',
			type: 'string',
			default: '',
			placeholder: 'your-aws-client-id',
			description: 'AWS Access Key ID for EventBridge authentication',
			displayOptions: {
				show: {
					eventProvider: ['aws'],
				},
			},
		},
		{
			displayName: 'AWS Client Secret',
			name: 'awsSecretAccessKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			placeholder: 'your-aws-client-secret',
			description: 'AWS Secret Access Key for EventBridge authentication',
			displayOptions: {
				show: {
					eventProvider: ['aws'],
				},
			},
		},
		{
			displayName: 'AWS Region',
			name: 'awsRegion',
			type: 'string',
			default: 'us-east-1',
			placeholder: 'us-east-1',
			description: 'AWS Region for EventBridge',
			displayOptions: {
				show: {
					eventProvider: ['aws'],
				},
			},
		},
		{
			displayName: 'Service Account JSON',
			name: 'serviceAccountJson',
			type: 'string',
			typeOptions: {
				rows: 6,
			},
			default: '',
			placeholder:
				'Paste the entire contents of your downloaded GCP service account .json key file',
			description:
				'The full JSON key file downloaded from GCP Console → IAM → Service Accounts → Keys',
			displayOptions: {
				show: {
					eventProvider: ['gcp'],
				},
			},
		},
		{
			displayName: 'GCP Region',
			name: 'gcpRegion',
			type: 'options',
			options: [
				{ name: 'asia-east1', value: 'asia-east1' },
				{ name: 'asia-east2', value: 'asia-east2' },
				{ name: 'asia-northeast1', value: 'asia-northeast1' },
				{ name: 'asia-northeast2', value: 'asia-northeast2' },
				{ name: 'asia-northeast3', value: 'asia-northeast3' },
				{ name: 'asia-south1', value: 'asia-south1' },
				{ name: 'asia-south2', value: 'asia-south2' },
				{ name: 'asia-southeast1', value: 'asia-southeast1' },
				{ name: 'asia-southeast2', value: 'asia-southeast2' },
				{ name: 'australia-southeast1', value: 'australia-southeast1' },
				{ name: 'australia-southeast2', value: 'australia-southeast2' },
				{ name: 'europe-central2', value: 'europe-central2' },
				{ name: 'europe-north1', value: 'europe-north1' },
				{ name: 'europe-southwest1', value: 'europe-southwest1' },
				{ name: 'europe-west1', value: 'europe-west1' },
				{ name: 'europe-west2', value: 'europe-west2' },
				{ name: 'europe-west3', value: 'europe-west3' },
				{ name: 'europe-west4', value: 'europe-west4' },
				{ name: 'europe-west6', value: 'europe-west6' },
				{ name: 'europe-west8', value: 'europe-west8' },
				{ name: 'europe-west9', value: 'europe-west9' },
				{ name: 'southamerica-east1', value: 'southamerica-east1' },
				{ name: 'southamerica-west1', value: 'southamerica-west1' },
				{ name: 'us-central1', value: 'us-central1' },
				{ name: 'us-east1', value: 'us-east1' },
				{ name: 'us-east4', value: 'us-east4' },
				{ name: 'us-east5', value: 'us-east5' },
				{ name: 'us-south1', value: 'us-south1' },
				{ name: 'us-west1', value: 'us-west1' },
				{ name: 'us-west2', value: 'us-west2' },
				{ name: 'us-west3', value: 'us-west3' },
				{ name: 'us-west4', value: 'us-west4' },
			],
			default: 'europe-west1',
			description: 'The GCP region for Pub/Sub resources',
			displayOptions: {
				show: {
					eventProvider: ['gcp'],
				},
			},
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
