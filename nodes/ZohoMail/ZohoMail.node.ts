import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

import { listAccounts } from './operations/account.operations';
import { executeFolderOperation, getFolders } from './operations/folder.operations';
import {
	deleteMessage,
	getAllMessages,
	getAttachmentContent,
	getLabels,
	getMessage,
	replyToMessage,
	searchMessages,
	sendMessage,
	updateMessages,
} from './operations/message.operations';
import { uploadAttachments } from './operations/attachment.operations';

export class ZohoMail implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Zoho Mail',
		name: 'zohoMail',
		icon: 'file:zohoMail.svg',
		group: ['transform'],
		version: 1,
		description: 'Manage Zoho Mail accounts, folders, messages, and attachments',
		defaults: {
			name: 'Zoho Mail',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'zohoMailOAuth2Api',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Account ID',
				name: 'accountId',
				type: 'string',
				default: '={{$credentials.defaultAccountId}}',
				description: 'Zoho Mail account ID. Falls back to the credential default when empty.',
			},
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				options: [
					{ name: 'Account', value: 'account' },
					{ name: 'Folder', value: 'folder' },
					{ name: 'Message', value: 'message' },
					{ name: 'Attachment', value: 'attachment' },
				],
				default: 'message',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['account'],
					},
				},
				options: [
					{
						name: 'Get All',
						value: 'getAll',
						description: 'List all Zoho Mail accounts',
					},
				],
				default: 'getAll',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['folder'],
					},
				},
				options: [
					{
						name: 'Get All',
						value: 'getAll',
						description: 'List folders in the account',
					},
				],
				default: 'getAll',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['message'],
					},
				},
				options: [
					{ name: 'Get All', value: 'getAll', description: 'List messages in a folder' },
					{ name: 'Search', value: 'search', description: 'Search messages' },
					{ name: 'Get', value: 'get', description: 'Get message content or headers' },
					{ name: 'Send', value: 'send', description: 'Send a message' },
					{ name: 'Reply', value: 'reply', description: 'Reply to a message' },
					{ name: 'Delete', value: 'delete', description: 'Delete a message' },
					{ name: 'Mark as Read', value: 'markAsRead' },
					{ name: 'Mark as Unread', value: 'markAsUnread' },
					{ name: 'Move', value: 'moveMessage' },
					{ name: 'Flag', value: 'setFlag' },
					{ name: 'Unflag', value: 'unflag' },
					{ name: 'Add Label', value: 'applyLabel' },
					{ name: 'Remove Label', value: 'removeLabel' },
					{ name: 'Remove All Labels', value: 'removeAllLabels' },
					{ name: 'Archive', value: 'archiveMails' },
					{ name: 'Unarchive', value: 'unArchiveMails' },
					{ name: 'Spam', value: 'moveToSpam' },
					{ name: 'Not Spam', value: 'markNotSpam' },
				],
				default: 'getAll',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['attachment'],
					},
				},
				options: [
					{ name: 'Upload', value: 'upload', description: 'Upload binary attachments' },
					{ name: 'Get', value: 'get', description: 'Download an attachment' },
				],
				default: 'upload',
			},
			// Message > getAll
			{
				displayName: 'Folder',
				name: 'folderId',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getFolders',
				},
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['getAll', 'get', 'reply', 'delete'],
					},
				},
				default: '',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['getAll'],
					},
				},
				typeOptions: { minValue: 1, maxValue: 200 },
				default: 25,
			},
			{
				displayName: 'Start',
				name: 'start',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['getAll'],
					},
				},
				default: 1,
			},
			// Message > search
			{
				displayName: 'Search Filters',
				name: 'searchFilters',
				type: 'collection',
				placeholder: 'Add Filter',
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['search'],
					},
				},
				default: {},
				options: [
					{
						displayName: 'From',
						name: 'searchFrom',
						type: 'string',
						default: '',
					},
					{
						displayName: 'To',
						name: 'searchTo',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Subject',
						name: 'searchSubject',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Body',
						name: 'searchBody',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Folder Name',
						name: 'searchFolderId',
						type: 'string',
						default: '',
						placeholder: 'Inbox',
					},
					{
						displayName: 'Start Date',
						name: 'searchStartTime',
						type: 'dateTime',
						default: '',
					},
					{
						displayName: 'End Date',
						name: 'searchEndTime',
						type: 'dateTime',
						default: '',
					},
					{
						displayName: 'Limit',
						name: 'limit',
						type: 'number',
						typeOptions: { minValue: 1, maxValue: 200 },
						default: 25,
					},
					{
						displayName: 'Start',
						name: 'start',
						type: 'number',
						default: 1,
					},
					{
						displayName: 'Include To',
						name: 'includeto',
						type: 'boolean',
						default: false,
					},
				],
			},
			// Message > get
			{
				displayName: 'Message ID',
				name: 'messageId',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['get', 'reply', 'delete', 'markAsRead', 'markAsUnread', 'moveMessage', 'setFlag', 'unflag', 'applyLabel', 'removeLabel', 'removeAllLabels', 'archiveMails', 'unArchiveMails', 'moveToSpam', 'markNotSpam'],
					},
				},
				default: '',
			},
			{
				displayName: 'Return Type',
				name: 'returnType',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['get'],
					},
				},
				options: [
					{ name: 'Content', value: 'content' },
					{ name: 'Header', value: 'header' },
					{ name: 'Details', value: 'details' },
					{ name: 'Original Message', value: 'originalmessage' },
				],
				default: 'content',
			},
			// Message > send
			{
				displayName: 'From Address',
				name: 'fromAddress',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['send', 'reply'],
					},
				},
				default: '',
				required: true,
			},
			{
				displayName: 'To Address',
				name: 'toAddress',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['send'],
					},
				},
				default: '',
				required: true,
			},
			{
				displayName: 'CC Address',
				name: 'ccAddress',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['send'],
					},
				},
				default: '',
			},
			{
				displayName: 'BCC Address',
				name: 'bccAddress',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['send'],
					},
				},
				default: '',
			},
			{
				displayName: 'Subject',
				name: 'subject',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['send', 'reply'],
					},
				},
				default: '',
			},
			{
				displayName: 'Content',
				name: 'content',
				type: 'string',
				typeOptions: { rows: 5 },
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['send'],
					},
				},
				default: '',
			},
			{
				displayName: 'HTML Content',
				name: 'htmlContent',
				type: 'string',
				typeOptions: { rows: 5 },
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['send'],
					},
				},
				default: '',
			},
			{
				displayName: 'Attachments',
				name: 'attachments',
				type: 'string',
				typeOptions: {
					binaryDataProperty: true,
					multipleValues: true,
				},
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['send'],
					},
				},
				default: '',
				placeholder: 'data',
			},
			{
				displayName: 'Attachment IDs',
				name: 'attachmentIds',
				type: 'string',
				typeOptions: {
					multipleValues: true,
				},
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['send'],
					},
				},
				default: [],
			},
			// Message > reply
			{
				displayName: 'Reply Body',
				name: 'replyBody',
				type: 'string',
				typeOptions: { rows: 5 },
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['reply'],
					},
				},
				default: '',
				required: true,
			},
			{
				displayName: 'CC Addresses',
				name: 'ccAddresses',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['reply'],
					},
				},
				default: '',
			},
			{
				displayName: 'BCC Addresses',
				name: 'bccAddresses',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['reply'],
					},
				},
				default: '',
			},
			{
				displayName: 'Reply To All',
				name: 'replyToAll',
				type: 'boolean',
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['reply'],
					},
				},
				default: false,
			},
			// Message > delete
			{
				displayName: 'Expunge',
				name: 'expunge',
				type: 'boolean',
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['delete'],
					},
				},
				default: false,
				description: 'Whether to permanently delete the message instead of moving it to trash',
			},
			// Message > move
			{
				displayName: 'Destination Folder',
				name: 'destfolderId',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getFolders',
				},
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['moveMessage'],
					},
				},
				default: '',
			},
			// Message > flag
			{
				displayName: 'Flag',
				name: 'flagid',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['setFlag'],
					},
				},
				options: [
					{ name: 'Info', value: 'info' },
					{ name: 'Important', value: 'important' },
					{ name: 'Follow Up', value: 'followup' },
				],
				default: 'important',
			},
			// Message > labels
			{
				displayName: 'Label',
				name: 'labelId',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getLabels',
				},
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['applyLabel', 'removeLabel'],
					},
				},
				default: '',
			},
			// Attachment > upload
			{
				displayName: 'Binary Property',
				name: 'binaryPropertyName',
				type: 'string',
				typeOptions: {
					binaryDataProperty: true,
					multipleValues: true,
				},
				displayOptions: {
					show: {
						resource: ['attachment'],
						operation: ['upload'],
					},
				},
				default: 'data',
			},
			// Attachment > get
			{
				displayName: 'Folder',
				name: 'folderId',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getFolders',
				},
				displayOptions: {
					show: {
						resource: ['attachment'],
						operation: ['get'],
					},
				},
				default: '',
			},
			{
				displayName: 'Message ID',
				name: 'messageId',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['attachment'],
						operation: ['get'],
					},
				},
				default: '',
			},
			{
				displayName: 'Attachment ID',
				name: 'attachmentId',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['attachment'],
						operation: ['get'],
					},
				},
				default: '',
			},
		] as INodeProperties[],
	};

	methods = {
		loadOptions: {
			getFolders,
			getLabels,
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;
		const accountId = (this.getNodeParameter('accountId', 0, '') as string) ||
			((await this.getCredentials('zohoMailOAuth2Api')).defaultAccountId as string | undefined) ||
			'';

		if (!accountId && resource !== 'account') {
			throw new Error('Account ID is required');
		}

		let responseData: INodeExecutionData[] = [];

		switch (resource) {
			case 'account':
				responseData = await listAccounts.call(this);
				break;
			case 'folder':
				responseData = await executeFolderOperation.call(this);
				break;
			case 'message': {
				switch (operation) {
					case 'getAll': {
						const folderId = this.getNodeParameter('folderId', 0) as string;
						const limit = this.getNodeParameter('limit', 0, 25) as number;
						const start = this.getNodeParameter('start', 0, 1) as number;
						responseData = await getAllMessages.call(this, accountId, folderId, limit, start);
						break;
					}
					case 'search':
						responseData = await searchMessages.call(this, accountId);
						break;
					case 'get': {
						const messageId = this.getNodeParameter('messageId', 0) as string;
						const folderId = this.getNodeParameter('folderId', 0) as string;
						const returnType = this.getNodeParameter('returnType', 0) as string;
						responseData = await getMessage.call(this, accountId, messageId, folderId, returnType);
						break;
					}
					case 'send':
						responseData = await sendMessage.call(this, accountId);
						break;
					case 'reply': {
						const folderId = this.getNodeParameter('folderId', 0) as string;
						responseData = await replyToMessage.call(this, accountId, folderId);
						break;
					}
					case 'delete': {
						const folderId = this.getNodeParameter('folderId', 0) as string;
						responseData = await deleteMessage.call(this, accountId, folderId);
						break;
					}
					case 'unflag':
						responseData = await updateMessages.call(this, accountId, 'setFlag');
						break;
					default:
						responseData = await updateMessages.call(this, accountId, operation);
				}
				break;
			}
			case 'attachment': {
				if (operation === 'upload') {
					const propertyNames = this.getNodeParameter('binaryPropertyName', 0, []) as string[];
					const uploads = await uploadAttachments.call(this, accountId, propertyNames);
					responseData = this.helpers.returnJsonArray(uploads as unknown as IDataObject[]);
				} else {
					const folderId = this.getNodeParameter('folderId', 0) as string;
					const messageId = this.getNodeParameter('messageId', 0) as string;
					const attachmentId = this.getNodeParameter('attachmentId', 0) as string;
					responseData = await getAttachmentContent.call(this, accountId, folderId, messageId, attachmentId);
				}
				break;
			}
			default:
				throw new Error(`Unsupported resource: ${resource}`);
		}

		return [responseData];
	}
}
