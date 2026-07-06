import type {
	IDataObject,
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
} from 'n8n-workflow';

import { joinAddresses, toArray, zohoMailApiRequest } from '../../../transport';
import type { ZohoAttachmentUpload, ZohoMessageContent, ZohoMessageSummary } from '../../../transport/types';
import { getAttachment } from './attachment.operations';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatZohoDate(value: string | number | undefined): string | undefined {
	if (!value) return undefined;
	const date = new Date(value);
	if (isNaN(date.getTime())) return undefined;
	const day = String(date.getUTCDate()).padStart(2, '0');
	const month = MONTHS[date.getUTCMonth()];
	const year = date.getUTCFullYear();
	return `${day}-${month}-${year}`;
}

export async function getLabels(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	const accountId = (this.getCurrentNodeParameter('accountId') as string | undefined) ?? '';
	if (!accountId) return [];
	const response = (await zohoMailApiRequest.call(this, 'GET', `/api/accounts/${accountId}/labels`)) as {
		data?: Array<{ labelId: string; labelName: string }>;
	};
	return (response.data ?? []).map((label) => ({ name: label.labelName, value: label.labelId }));
}

export async function getAllMessages(
	this: IExecuteFunctions,
	accountId: string,
	folderId: string,
	limit: number,
	start: number,
): Promise<INodeExecutionData[]> {
	const qs: IDataObject = {
		folderId,
		limit,
		start,
		sortBy: 'date',
		sortorder: false,
	};
	const response = (await zohoMailApiRequest.call(this, 'GET', `/api/accounts/${accountId}/messages/view`, {}, qs)) as {
		data?: ZohoMessageSummary[];
	};
	return this.helpers.returnJsonArray((response.data ?? []) as unknown as IDataObject[]);
}

export async function searchMessages(
	this: IExecuteFunctions,
	accountId: string,
): Promise<INodeExecutionData[]> {
	const {
		searchFrom,
		searchTo,
		searchSubject,
		searchBody,
		searchFolderId,
		searchStartTime,
		searchEndTime,
		limit,
		start,
		includeto,
	} = this.getNodeParameter('searchFilters', 0) as IDataObject;

	const parts: string[] = [];
	if (searchFrom) parts.push(`sender:${searchFrom}`);
	if (searchTo) parts.push(`to:${searchTo}`);
	if (searchSubject) parts.push(`subject:${searchSubject}`);
	if (searchBody) parts.push(`content:${searchBody}`);
	if (searchFolderId) parts.push(`in:${searchFolderId}`);
	const fromDate = formatZohoDate(searchStartTime as string | number | undefined);
	const toDate = formatZohoDate(searchEndTime as string | number | undefined);
	if (fromDate) parts.push(`fromDate:${fromDate}`);
	if (toDate) parts.push(`toDate:${toDate}`);

	const qs: IDataObject = {
		searchKey: parts.join('::'),
		start: start ?? 1,
		limit: limit ?? 25,
	};
	if (includeto) qs.includeto = true;

	const response = (await zohoMailApiRequest.call(
		this,
		'GET',
		`/api/accounts/${accountId}/messages/search`,
		{},
		qs,
	)) as { data?: ZohoMessageSummary[] };
	return this.helpers.returnJsonArray((response.data ?? []) as unknown as IDataObject[]);
}

export async function getMessage(
	this: IExecuteFunctions,
	accountId: string,
	messageId: string,
	folderId: string,
	returnType: string,
): Promise<INodeExecutionData[]> {
	let endpoint: string;
	if (returnType === 'originalmessage') {
		endpoint = `/api/accounts/${accountId}/messages/${messageId}/originalmessage`;
	} else {
		endpoint = `/api/accounts/${accountId}/folders/${folderId}/messages/${messageId}/${returnType}`;
	}

	const response = (await zohoMailApiRequest.call(this, 'GET', endpoint, {}, {})) as {
		data?: ZohoMessageContent | string;
	};
	return this.helpers.returnJsonArray([(response.data ?? {}) as unknown as IDataObject]);
}

export async function sendMessage(
	this: IExecuteFunctions,
	accountId: string,
): Promise<INodeExecutionData[]> {
	const fromAddress = this.getNodeParameter('fromAddress', 0) as string;
	const toAddress = this.getNodeParameter('toAddress', 0) as string | string[];
	const ccAddress = this.getNodeParameter('ccAddress', 0, '') as string | string[];
	const bccAddress = this.getNodeParameter('bccAddress', 0, '') as string | string[];
	const subject = this.getNodeParameter('subject', 0, '') as string;
	const content = this.getNodeParameter('content', 0, '') as string;
	const htmlContent = this.getNodeParameter('htmlContent', 0, '') as string;
	const attachmentPropertyNames = this.getNodeParameter('attachments', 0, []) as string | string[];
	const extraAttachmentUploads = this.getNodeParameter('attachmentUploads', 0, []) as Array<
		Partial<ZohoAttachmentUpload>
	>;

	const body: IDataObject = {
		fromAddress,
		toAddress: joinAddresses(toAddress),
	};
	if (ccAddress) body.ccAddress = joinAddresses(ccAddress);
	if (bccAddress) body.bccAddress = joinAddresses(bccAddress);
	if (subject) body.subject = subject;
	if (htmlContent) {
		body.htmlContent = htmlContent;
		body.mailFormat = 'html';
	} else if (content) {
		body.content = content;
	}

	const attachmentUploads: IDataObject[] = [];
	const properties = (
		Array.isArray(attachmentPropertyNames)
			? attachmentPropertyNames
			: String(attachmentPropertyNames)
					.split(',')
					.map((p) => p.trim())
					.filter(Boolean)
	).map((p) => String(p));
	if (properties.length > 0) {
		const { uploadAttachments } = await import('./attachment.operations');
		const uploads = await uploadAttachments.call(this, accountId, properties);
		for (const upload of uploads) {
			attachmentUploads.push(upload as unknown as IDataObject);
		}
	}
	for (const upload of toArray(extraAttachmentUploads)) {
		if (!upload.storeName || !upload.attachmentPath || !upload.attachmentName) {
			throw new Error(
				'Each attachment upload must include storeName, attachmentPath, and attachmentName.',
			);
		}
		attachmentUploads.push(upload as unknown as IDataObject);
	}
	if (attachmentUploads.length > 0) {
		body.attachments = attachmentUploads;
	}

	const response = (await zohoMailApiRequest.call(
		this,
		'POST',
		`/api/accounts/${accountId}/messages`,
		body,
	)) as IDataObject;
	return this.helpers.returnJsonArray([response]);
}

export async function replyToMessage(
	this: IExecuteFunctions,
	accountId: string,
	folderId: string,
): Promise<INodeExecutionData[]> {
	const messageId = this.getNodeParameter('messageId', 0) as string;
	const fromAddress = this.getNodeParameter('fromAddress', 0) as string;
	const replyBody = this.getNodeParameter('replyBody', 0) as string;
	const ccAddresses = this.getNodeParameter('ccAddresses', 0, '') as string | string[];
	const bccAddresses = this.getNodeParameter('bccAddresses', 0, '') as string | string[];
	const replyToAll = this.getNodeParameter('replyToAll', 0, false) as boolean;
	const subject = this.getNodeParameter('subject', 0, '') as string;

	const cc: string[] = toArray(ccAddresses).map((a) => String(a).trim()).filter(Boolean);

	const parent = (await zohoMailApiRequest.call(
		this,
		'GET',
		`/api/accounts/${accountId}/folders/${folderId}/messages/${messageId}/details`,
		{},
		{},
	)) as { data?: ZohoMessageContent };
	const parentData = parent.data ?? ({} as ZohoMessageContent);

	const to: string[] = [];
	if (parentData.fromAddress) {
		to.push(...String(parentData.fromAddress).split(',').map((a) => a.trim()).filter(Boolean));
	}
	if (replyToAll) {
		if (parentData.toAddress) to.push(...String(parentData.toAddress).split(',').map((a) => a.trim()).filter(Boolean));
		if (parentData.ccAddress) cc.push(...String(parentData.ccAddress).split(',').map((a) => a.trim()).filter(Boolean));
	}

	const body: IDataObject = {
		fromAddress,
		toAddress: to.join(', '),
		subject: subject || (parentData.subject ? `Re: ${parentData.subject}` : `Re: ${messageId}`),
		content: replyBody,
		action: 'reply',
	};
	if (cc.length > 0) body.ccAddress = cc.join(', ');
	const bcc = toArray(bccAddresses).map((a) => String(a).trim()).filter(Boolean);
	if (bcc.length > 0) body.bccAddress = bcc.join(', ');

	const response = (await zohoMailApiRequest.call(
		this,
		'POST',
		`/api/accounts/${accountId}/messages/${messageId}`,
		body,
	)) as IDataObject;
	return this.helpers.returnJsonArray([response]);
}

export async function deleteMessage(
	this: IExecuteFunctions,
	accountId: string,
	folderId: string,
): Promise<INodeExecutionData[]> {
	const messageId = this.getNodeParameter('messageId', 0) as string;
	const expunge = this.getNodeParameter('expunge', 0, false) as boolean;
	const response = (await zohoMailApiRequest.call(
		this,
		'DELETE',
		`/api/accounts/${accountId}/folders/${folderId}/messages/${messageId}`,
		{},
		{ expunge },
	)) as IDataObject;
	return this.helpers.returnJsonArray([response]);
}

export async function updateMessages(
	this: IExecuteFunctions,
	accountId: string,
	mode: string,
): Promise<INodeExecutionData[]> {
	const messageId = this.getNodeParameter('messageId', 0) as string;
	const body: IDataObject = {
		mode,
		messageId: [messageId],
	};

	if (mode === 'moveMessage') {
		body.destfolderId = this.getNodeParameter('destfolderId', 0) as string;
	}
	if (mode === 'setFlag') {
		body.flagid = (this.getNodeParameter('flagid', 0, '') as string) || 'flag_not_set';
	}
	if (mode === 'applyLabel' || mode === 'removeLabel') {
		const labelId = this.getNodeParameter('labelId', 0) as string;
		body.labelId = [labelId];
	}

	const response = (await zohoMailApiRequest.call(
		this,
		'PUT',
		`/api/accounts/${accountId}/updatemessage`,
		body,
	)) as IDataObject;
	return this.helpers.returnJsonArray([response]);
}

export async function getAttachmentContent(
	this: IExecuteFunctions,
	accountId: string,
	folderId: string,
	messageId: string,
	attachmentId: string,
): Promise<INodeExecutionData[]> {
	const buffer = await getAttachment.call(this, accountId, folderId, messageId, attachmentId);
	const binaryData = await this.helpers.prepareBinaryData(buffer, undefined, 'application/octet-stream');
	return [
		{
			json: {},
			binary: {
				data: binaryData,
			},
		},
	];
}
