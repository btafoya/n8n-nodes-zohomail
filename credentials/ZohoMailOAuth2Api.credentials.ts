import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	Icon,
	INodeProperties,
} from 'n8n-workflow';

const authUrlExpression = `={{$credentials.dataCenter === 'us' ? 'https://accounts.zoho.com/oauth/v2/auth' : $credentials.dataCenter === 'eu' ? 'https://accounts.zoho.eu/oauth/v2/auth' : $credentials.dataCenter === 'in' ? 'https://accounts.zoho.in/oauth/v2/auth' : $credentials.dataCenter === 'au' ? 'https://accounts.zoho.com.au/oauth/v2/auth' : $credentials.dataCenter === 'jp' ? 'https://accounts.zoho.jp/oauth/v2/auth' : $credentials.dataCenter === 'ca' ? 'https://accounts.zohocloud.ca/oauth/v2/auth' : $credentials.dataCenter === 'cn' ? 'https://accounts.zoho.com.cn/oauth/v2/auth' : $credentials.dataCenter === 'ae' ? 'https://accounts.zoho.ae/oauth/v2/auth' : 'https://accounts.zoho.sa/oauth/v2/auth'}}`;

const tokenUrlExpression = `={{$credentials.dataCenter === 'us' ? 'https://accounts.zoho.com/oauth/v2/token' : $credentials.dataCenter === 'eu' ? 'https://accounts.zoho.eu/oauth/v2/token' : $credentials.dataCenter === 'in' ? 'https://accounts.zoho.in/oauth/v2/token' : $credentials.dataCenter === 'au' ? 'https://accounts.zoho.com.au/oauth/v2/token' : $credentials.dataCenter === 'jp' ? 'https://accounts.zoho.jp/oauth/v2/token' : $credentials.dataCenter === 'ca' ? 'https://accounts.zohocloud.ca/oauth/v2/token' : $credentials.dataCenter === 'cn' ? 'https://accounts.zoho.com.cn/oauth/v2/token' : $credentials.dataCenter === 'ae' ? 'https://accounts.zoho.ae/oauth/v2/token' : 'https://accounts.zoho.sa/oauth/v2/token'}}`;

const apiBaseUrlExpression = `={{$credentials.dataCenter === 'us' ? 'https://mail.zoho.com' : $credentials.dataCenter === 'eu' ? 'https://mail.zoho.eu' : $credentials.dataCenter === 'in' ? 'https://mail.zoho.in' : $credentials.dataCenter === 'au' ? 'https://mail.zoho.com.au' : $credentials.dataCenter === 'jp' ? 'https://mail.zoho.jp' : $credentials.dataCenter === 'ca' ? 'https://mail.zohocloud.ca' : $credentials.dataCenter === 'cn' ? 'https://mail.zoho.com.cn' : $credentials.dataCenter === 'ae' ? 'https://mail.zoho.ae' : 'https://mail.zoho.sa'}}`;

export class ZohoMailOAuth2Api implements ICredentialType {
	name = 'zohoMailOAuth2Api';

	displayName = 'Zoho Mail OAuth2 API';

	extends = ['oAuth2Api'];

	icon: Icon = 'file:zohoMail.svg';

	documentationUrl = 'zohomail';

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Zoho-oauthtoken {{$credentials.oauthTokenData.access_token}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: apiBaseUrlExpression,
			url: '/api/accounts',
			method: 'GET',
		},
	};

	properties: INodeProperties[] = [
		{
			displayName: 'Data Center',
			name: 'dataCenter',
			type: 'options',
			default: 'us',
			required: true,
			options: [
				{ name: 'US', value: 'us' },
				{ name: 'EU', value: 'eu' },
				{ name: 'India', value: 'in' },
				{ name: 'Australia', value: 'au' },
				{ name: 'Japan', value: 'jp' },
				{ name: 'Canada', value: 'ca' },
				{ name: 'China', value: 'cn' },
				{ name: 'UAE', value: 'ae' },
				{ name: 'Saudi Arabia', value: 'sa' },
			],
		},
		{
			displayName: 'Default Account ID',
			name: 'defaultAccountId',
			type: 'string',
			default: '',
			description: 'Used when the node does not override the account ID',
		},
		{
			displayName: 'Grant Type',
			name: 'grantType',
			type: 'hidden',
			default: 'authorizationCode',
		},
		{
			displayName: 'Authorization URL',
			name: 'authUrl',
			type: 'hidden',
			default: authUrlExpression,
			required: true,
		},
		{
			displayName: 'Access Token URL',
			name: 'accessTokenUrl',
			type: 'hidden',
			default: tokenUrlExpression,
			required: true,
		},
		{
			displayName: 'Scope',
			name: 'scope',
			type: 'hidden',
			default: 'ZohoMail.accounts.ALL,ZohoMail.messages.ALL,ZohoMail.folders.ALL,ZohoMail.tags.ALL',
		},
		{
			displayName: 'Auth URI Query Parameters',
			name: 'authQueryParameters',
			type: 'hidden',
			default: 'access_type=offline',
		},
		{
			displayName: 'Authentication',
			name: 'authentication',
			type: 'hidden',
			default: 'body',
		},
	];
}
