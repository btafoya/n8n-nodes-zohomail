import type {
	IDataObject,
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
} from 'n8n-workflow';

import { zohoMailApiRequest } from '../../../transport';
import type { ZohoAccount } from '../../../transport/types';

export async function listAccounts(this: IExecuteFunctions): Promise<INodeExecutionData[]> {
	const accounts = (await zohoMailApiRequest.call(this, 'GET', '/api/accounts')) as {
		data?: ZohoAccount[];
	};
	return this.helpers.returnJsonArray((accounts.data ?? []) as unknown as IDataObject[]);
}

export async function getAccounts(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	const accounts = (await zohoMailApiRequest.call(this, 'GET', '/api/accounts')) as {
		data?: ZohoAccount[];
	};

	return (accounts.data ?? []).map((account) => {
		const label = account.displayName ?? account.emailAddress ?? account.accountId;
		return {
			name: `${label} (${account.accountId})`,
			value: account.accountId,
		};
	});
}
