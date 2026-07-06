import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';

import { toArray, zohoMailApiRequest } from '../../../transport';
import type { ZohoAttachmentUpload } from '../../../transport/types';

export async function uploadAttachments(
	this: IExecuteFunctions,
	accountId: string,
	propertyNames: string | string[],
): Promise<ZohoAttachmentUpload[]> {
	const names = toArray(propertyNames).map((p) => String(p).trim()).filter(Boolean);
	const formData = new FormData();
	for (const propertyName of names) {
		const binaryData = this.helpers.assertBinaryData(0, propertyName);
		const buffer = await this.helpers.getBinaryDataBuffer(0, propertyName);
		const fileName = binaryData.fileName ?? propertyName;
		const blob = new Blob([new Uint8Array(buffer)]);
		formData.append('attach', blob, fileName);
	}

	const response = (await zohoMailApiRequest.call(
		this,
		'POST',
		`/api/accounts/${accountId}/messages/attachments`,
		formData as unknown as IDataObject,
		{ uploadType: 'multipart' },
	)) as { data?: ZohoAttachmentUpload[] };

	return response.data ?? [];
}

export async function getAttachment(
	this: IExecuteFunctions,
	accountId: string,
	folderId: string,
	messageId: string,
	attachmentId: string,
): Promise<Buffer> {
	return (await zohoMailApiRequest.call(
		this,
		'GET',
		`/api/accounts/${accountId}/folders/${folderId}/messages/${messageId}/attachments/${attachmentId}`,
		{},
		{},
		{ encoding: 'arraybuffer', json: false },
	)) as unknown as Buffer;
}
