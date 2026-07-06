import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';

import { zohoMailApiRequest } from '../../../transport';
import type { ZohoAccount } from '../../../transport/types';

export async function listAccounts(this: IExecuteFunctions): Promise<INodeExecutionData[]> {
	const accounts = (await zohoMailApiRequest.call(this, 'GET', '/api/accounts')) as {
		data?: ZohoAccount[];
	};
	return this.helpers.returnJsonArray((accounts.data ?? []) as unknown as IDataObject[]);
}
