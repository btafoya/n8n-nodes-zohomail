export type DataCenter =
	| 'us'
	| 'eu'
	| 'in'
	| 'au'
	| 'jp'
	| 'ca'
	| 'cn'
	| 'ae'
	| 'sa';

export interface ZohoAccount {
	accountId: string;
	displayName?: string;
	emailAddress?: string;
}

export interface ZohoFolder {
	folderId: string;
	folderName: string;
}

export interface ZohoMessageSummary {
	messageId: string;
	receivedTime?: number | string;
	receivedtime?: number | string;
	folderId?: string;
}

export interface ZohoMessageContent {
	messageId: string;
	subject?: string;
	fromAddress?: string;
	toAddress?: string;
	ccAddress?: string;
	content?: string;
	htmlContent?: string;
	receivedTime?: number | string;
	receivedtime?: number | string;
}

export interface ZohoAttachmentUpload {
	storeName: string;
	attachmentPath: string;
	attachmentName: string;
}

export interface ZohoAttachment {
	attachmentId: string;
	fileName?: string;
}

export interface ZohoApiError {
	errorCode?: string;
	message?: string;
}

export interface ZohoMailApiCredentials {
	clientId: string;
	clientSecret: string;
	dataCenter: DataCenter;
	defaultAccountId?: string;
	oauthTokenData?: { access_token: string };
}
