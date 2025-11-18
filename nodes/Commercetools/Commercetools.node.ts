import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { commercetoolsDescription } from './descriptions/Commercetools.description';
import { executeProductOperation } from './operations/product.operations';

export class Commercetools implements INodeType {
	description: INodeTypeDescription = {
		...commercetoolsDescription,
		icon: 'file:Commercetools.svg',
		usableAsTool: true,
	};


	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const resource = this.getNodeParameter('resource', itemIndex) as string;
				const operation = this.getNodeParameter('operation', itemIndex) as string;

				if (resource !== 'product') {
					throw new NodeOperationError(this.getNode(), `Unsupported resource: ${resource}`, {
						itemIndex,
					});
				}

				const credentials = (await this.getCredentials('commerceToolsOAuth2Api')) as IDataObject;
				const projectKey = credentials.projectKey as string;
				const region = (credentials.region as string) || 'australia-southeast1.gcp';

				if (!projectKey) {
					throw new NodeOperationError(this.getNode(), 'Project key is missing in the credentials', {
						itemIndex,
					});
				}

				const baseUrl = `https://api.${region}.commercetools.com/${projectKey}`;

				const results = await executeProductOperation.call(this, {
					operation,
					itemIndex,
					baseUrl,
					items,
				});

				returnData.push(...results);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: (error as Error).message,
							itemIndex,
						},
					});
					continue;
				}

				if (error instanceof NodeOperationError) {
					throw error;
				}

				throw new NodeOperationError(this.getNode(), error as Error, { itemIndex });
			}
		}

		return [returnData];
	}
}
