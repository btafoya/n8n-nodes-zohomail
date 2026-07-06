import type {
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IPollFunctions,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';
import { cronNodeOptions } from 'n8n-workflow';

import { getFolders } from '../ZohoMail/operations/folder.operations';
import { normalizeReceivedTime, zohoMailApiRequest } from '../../transport';
import type { ZohoMessageSummary } from '../../transport/types';

interface TriggerStaticData {
	lastReceivedTime?: number;
	seenMessageIds?: string[];
}

export class ZohoMailTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Zoho Mail Trigger',
		name: 'zohoMailTrigger',
		icon: 'file:zohoMailTrigger.svg',
		group: ['trigger'],
		version: 1,
		description: 'Triggers when a new email arrives in a Zoho Mail folder',
		eventTriggerDescription: 'When a new email arrives in folder {folderId}',
		defaults: {
			name: 'Zoho Mail Trigger',
		},
		polling: true,
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'zohoMailOAuth2Api',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Poll Times',
				name: 'pollTimes',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
					multipleValueButtonText: 'Add Poll Time',
				},
				default: { item: [{ mode: 'everyMinute' }] },
				description: 'Time at which polling should occur',
				placeholder: 'Add Poll Time',
				options: cronNodeOptions,
			},
			{
				displayName: 'Account ID',
				name: 'accountId',
				type: 'string',
				default: '={{$credentials.defaultAccountId}}',
				description: 'Zoho Mail account ID. Falls back to the credential default when empty.',
			},
			{
				displayName: 'Folder',
				name: 'folderId',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getFolders',
				},
				default: 'Inbox',
				required: true,
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 50,
				typeOptions: { minValue: 1, maxValue: 200 },
				description: 'Maximum number of messages to fetch per poll',
			},
			{
				displayName: 'Fetch Historical',
				name: 'fetchHistorical',
				type: 'boolean',
				default: false,
				description: 'Whether to emit existing messages on first activation',
			},
		],
	};

	methods = {
		loadOptions: {
			getFolders,
		},
	};

	async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
		if (this.getMode() === 'manual') {
			return [[]];
		}

		const accountId = (this.getNodeParameter('accountId', '') as string) ||
			((await this.getCredentials('zohoMailOAuth2Api')).defaultAccountId as string | undefined) ||
			'';
		if (!accountId) {
			throw new Error('Account ID is required');
		}

		const folderId = this.getNodeParameter('folderId') as string;
		const limit = this.getNodeParameter('limit', 50) as number;
		const fetchHistorical = this.getNodeParameter('fetchHistorical', false) as boolean;

		const staticData = this.getWorkflowStaticData('node') as TriggerStaticData;
		const lastReceivedTime = staticData.lastReceivedTime ?? 0;
		const seenMessageIds = new Set(staticData.seenMessageIds ?? []);

		const response = (await zohoMailApiRequest.call(
			this,
			'GET',
			`/api/accounts/${accountId}/messages/view`,
			{},
			{
				folderId,
				limit,
				sortBy: 'date',
				sortorder: false,
			},
		)) as { data?: ZohoMessageSummary[] };

		const messages = response.data ?? [];
		if (!messages.length) {
			return null;
		}

		let newMaxTime = 0;
		const newSeenIds: string[] = [];
		const emitted: INodeExecutionData[] = [];
		const isFirstActivation = !staticData.lastReceivedTime;

		for (const message of messages) {
			const receivedTime = Number(
				normalizeReceivedTime(message.receivedTime ?? message.receivedtime),
			);
			const messageId = String(message.messageId);

			if (receivedTime > newMaxTime) {
				newMaxTime = receivedTime;
				newSeenIds.length = 0;
			}
			if (receivedTime === newMaxTime) {
				newSeenIds.push(messageId);
			}

			if (isFirstActivation) {
				continue;
			}

			if (receivedTime > lastReceivedTime) {
				emitted.push({ json: message as unknown as IDataObject });
			} else if (receivedTime === lastReceivedTime && !seenMessageIds.has(messageId)) {
				emitted.push({ json: message as unknown as IDataObject });
			}
		}

		staticData.lastReceivedTime = newMaxTime;
		staticData.seenMessageIds = newSeenIds;

		if (isFirstActivation) {
			return fetchHistorical ? [this.helpers.returnJsonArray(messages as unknown as IDataObject[])] : null;
		}

		return emitted.length > 0 ? [emitted] : null;
	}
}
