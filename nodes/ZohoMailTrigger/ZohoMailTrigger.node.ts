import type {
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IPollFunctions,
} from 'n8n-workflow';
import { getAccounts } from '../ZohoMail/operations/account.operations';
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
		outputs: ['main'],
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
				options: [
					{
						name: 'item',
						displayName: 'Item',
						values: [
							{
								displayName: 'Mode',
								name: 'mode',
								type: 'options',
								options: [
									{ name: 'Every Minute', value: 'everyMinute' },
									{ name: 'Every Hour', value: 'everyHour' },
									{ name: 'Every Day', value: 'everyDay' },
									{ name: 'Every Week', value: 'everyWeek' },
									{ name: 'Every Month', value: 'everyMonth' },
									{ name: 'Every X', value: 'everyX' },
									{ name: 'Custom', value: 'custom' },
								],
								default: 'everyDay',
								description: 'How often to trigger.',
							},
							{
								displayName: 'Hour',
								name: 'hour',
								type: 'number',
								typeOptions: { minValue: 0, maxValue: 23 },
								displayOptions: {
									hide: {
										mode: ['custom', 'everyHour', 'everyMinute', 'everyX'],
									},
								},
								default: 14,
								description: 'The hour of the day to trigger (24h format)',
							},
							{
								displayName: 'Minute',
								name: 'minute',
								type: 'number',
								typeOptions: { minValue: 0, maxValue: 59 },
								displayOptions: {
									hide: {
										mode: ['custom', 'everyMinute', 'everyX'],
									},
								},
								default: 0,
								description: 'The minute of the day to trigger',
							},
							{
								displayName: 'Day of Month',
								name: 'dayOfMonth',
								type: 'number',
								displayOptions: {
									show: {
										mode: ['everyMonth'],
									},
								},
								typeOptions: { minValue: 1, maxValue: 31 },
								default: 1,
								description: 'The day of the month to trigger',
							},
							{
								displayName: 'Weekday',
								name: 'weekday',
								type: 'options',
								displayOptions: {
									show: {
										mode: ['everyWeek'],
									},
								},
								options: [
									{ name: 'Monday', value: '1' },
									{ name: 'Tuesday', value: '2' },
									{ name: 'Wednesday', value: '3' },
									{ name: 'Thursday', value: '4' },
									{ name: 'Friday', value: '5' },
									{ name: 'Saturday', value: '6' },
									{ name: 'Sunday', value: '0' },
								],
								default: '1',
								description: 'The weekday to trigger',
							},
							{
								displayName: 'Cron Expression',
								name: 'cronExpression',
								type: 'string',
								displayOptions: {
									show: {
										mode: ['custom'],
									},
								},
								default: '* * * * * *',
								description: 'Use custom cron expression.',
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'number',
								typeOptions: { minValue: 0, maxValue: 1000 },
								displayOptions: {
									show: {
										mode: ['everyX'],
									},
								},
								default: 2,
								description: 'All how many X minutes/hours it should trigger',
							},
							{
								displayName: 'Unit',
								name: 'unit',
								type: 'options',
								displayOptions: {
									show: {
										mode: ['everyX'],
									},
								},
								options: [
									{ name: 'Minutes', value: 'minutes' },
									{ name: 'Hours', value: 'hours' },
								],
								default: 'hours',
								description: 'If it should trigger all X minutes or hours',
							},
						],
					},
				],
			},
			{
				displayName: 'Account',
				name: 'accountId',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getAccounts',
				},
				default: '={{$credentials.defaultAccountId}}',
				description: 'Zoho Mail account. Falls back to the credential default when empty.',
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
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 50,
				typeOptions: { minValue: 1, maxValue: 200 },
				description: 'Maximum number of messages to fetch per poll',
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				options: [
					{ name: 'All', value: 'all' },
					{ name: 'Read', value: 'read' },
					{ name: 'Unread', value: 'unread' },
					{ name: 'Flagged', value: 'flagged' },
					{ name: 'Unflagged', value: 'unflagged' },
				],
				default: 'all',
				description: 'Only poll messages matching this status',
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
			getAccounts,
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
		const status = this.getNodeParameter('status', 'all') as string;
		const fetchHistorical = this.getNodeParameter('fetchHistorical', false) as boolean;

		const staticData = this.getWorkflowStaticData('node') as TriggerStaticData;
		const lastReceivedTime = staticData.lastReceivedTime ?? 0;
		const seenMessageIds = new Set(staticData.seenMessageIds ?? []);

		const qs: IDataObject = {
			folderId,
			limit,
			sortBy: 'date',
			sortorder: false,
		};
		if (status && status !== 'all') {
			qs.status = status;
		}

		const response = (await zohoMailApiRequest.call(
			this,
			'GET',
			`/api/accounts/${accountId}/messages/view`,
			{},
			qs,
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
