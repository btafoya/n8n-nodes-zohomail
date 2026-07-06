import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
	IPollFunctions,
	ITriggerFunctions,
} from 'n8n-workflow';
import { NodeApiError, type JsonObject } from 'n8n-workflow';

import type { DataCenter, ZohoApiError } from './types';

const DATA_CENTER_HOSTS: Record<DataCenter, string> = {
	us: 'mail.zoho.com',
	eu: 'mail.zoho.eu',
	in: 'mail.zoho.in',
	au: 'mail.zoho.com.au',
	jp: 'mail.zoho.jp',
	ca: 'mail.zohocloud.ca',
	cn: 'mail.zoho.com.cn',
	ae: 'mail.zoho.ae',
	sa: 'mail.zoho.sa',
};

export function getBaseUrl(dataCenter: DataCenter): string {
	return `https://${DATA_CENTER_HOSTS[dataCenter]}`;
}

export function getAuthBaseUrl(dataCenter: DataCenter): string {
	const host = DATA_CENTER_HOSTS[dataCenter].replace(/^mail\./, 'accounts.');
	return `https://${host}`;
}

export async function zohoMailApiRequest<T = IDataObject>(
	this:
		| IExecuteFunctions
		| ILoadOptionsFunctions
		| IPollFunctions
		| ITriggerFunctions,
	method: IHttpRequestOptions['method'],
	endpoint: string,
	body: IDataObject | FormData = {},
	qs: IDataObject = {},
	extraOptions: Partial<IHttpRequestOptions> = {},
): Promise<T> {
	const credentials = await this.getCredentials('zohoMailOAuth2Api');
	const dataCenter = (credentials.dataCenter as DataCenter | undefined) ?? 'us';

	const options: IHttpRequestOptions = {
		method,
		baseURL: getBaseUrl(dataCenter),
		url: endpoint,
		headers: {
			Accept: 'application/json',
		},
		qs,
		body,
		json: true,
		...extraOptions,
	};

	try {
		return (await this.helpers.httpRequestWithAuthentication.call(
			this,
			'zohoMailOAuth2Api',
			options,
		)) as T;
	} catch (error) {
		const zohoError = error as ZohoApiError & { statusCode?: number };
		const message = zohoError.message
			? `${zohoError.errorCode ?? zohoError.statusCode}: ${zohoError.message}`
			: undefined;
		throw new NodeApiError(this.getNode(), error as unknown as JsonObject, {
			message,
		});
	}
}

export function normalizeReceivedTime(value: unknown): number | string | undefined {
	if (value === undefined || value === null) return undefined;
	if (typeof value === 'number') return value;
	if (typeof value === 'string') return value;
	return undefined;
}

export function toArray<T>(value: T | T[] | undefined): T[] {
	if (value === undefined || value === null) return [];
	return Array.isArray(value) ? value : [value];
}

export function joinAddresses(value: string | string[] | undefined): string | undefined {
	if (value === undefined || value === null) return undefined;
	return Array.isArray(value) ? value.join(', ') : value;
}
