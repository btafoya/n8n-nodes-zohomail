import type {
	IDataObject,
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
} from 'n8n-workflow';

import { zohoMailApiRequest } from '../../../transport';
import type { ZohoFolder } from '../../../transport/types';

export async function listFolders(
	this: IExecuteFunctions | ILoadOptionsFunctions,
	accountId: string,
): Promise<ZohoFolder[]> {
	const response = (await zohoMailApiRequest.call(
		this,
		'GET',
		`/api/accounts/${accountId}/folders`,
	)) as { data?: ZohoFolder[] };
	return response.data ?? [];
}

export async function getFolders(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	const accountId = (this.getCurrentNodeParameter('accountId') as string | undefined) ?? '';
	if (!accountId) return [];
	const folders = await listFolders.call(this, accountId);
	return folders.map((folder) => ({
		name: folder.folderName ?? folder.folderId,
		value: folder.folderId,
	}));
}

export async function executeFolderOperation(
	this: IExecuteFunctions,
): Promise<INodeExecutionData[]> {
	const accountId = this.getNodeParameter('accountId', 0) as string;
	const response = (await zohoMailApiRequest.call(
		this,
		'GET',
		`/api/accounts/${accountId}/folders`,
	)) as { data?: ZohoFolder[] };
	return this.helpers.returnJsonArray((response.data ?? []) as unknown as IDataObject[]);
}
