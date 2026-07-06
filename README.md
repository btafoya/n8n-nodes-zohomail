# n8n-nodes-zohomail

[![npm version](https://img.shields.io/npm/v/n8n-nodes-zohomail.svg)](https://www.npmjs.com/package/n8n-nodes-zohomail)
[![GitHub license](https://img.shields.io/github/license/btafoya/n8n-nodes-zohomail.svg)](https://github.com/btafoya/n8n-nodes-zohomail/blob/main/LICENSE)
[![GitHub issues](https://img.shields.io/github/issues/btafoya/n8n-nodes-zohomail.svg)](https://github.com/btafoya/n8n-nodes-zohomail/issues)
[![GitHub stars](https://img.shields.io/github/stars/btafoya/n8n-nodes-zohomail.svg?style=social)](https://github.com/btafoya/n8n-nodes-zohomail/stargazers)

An n8n community node for [Zoho Mail](https://www.zoho.com/mail/).

Repository: [https://github.com/btafoya/n8n-nodes-zohomail](https://github.com/btafoya/n8n-nodes-zohomail)

## Features

- OAuth2 authentication for Zoho Mail
- Action node (`Zoho Mail`) for accounts, folders, messages, attachments, and labels
- Polling trigger node (`Zoho Mail Trigger`) for new emails in a folder

## Installation

```bash
npm install n8n-nodes-zohomail
```

Or install from a local build:

```bash
cd /path/to/n8n
npm install /path/to/n8n-nodes-zohomail
```

## Development

```bash
npm install
npm run build
npm run dev
```

## Credentials

Create a **Zoho Mail OAuth2 API** credential:

1. Choose your Zoho data center.
2. Enter the OAuth client ID and secret from the [Zoho API Console](https://api-console.zoho.com/).
3. Optionally set a default Zoho Mail account ID to use across nodes.

Required scopes are requested automatically.

## Operations

### Zoho Mail (action node)

- **Account**: Get All
- **Folder**: Get All
- **Message**: Get All, Search, Get, Send, Reply, Delete
- **Message state**: Mark as Read/Unread, Move, Flag/Unflag, Add/Remove Label, Remove All Labels, Archive/Unarchive, Spam/Not Spam
- **Attachment**: Upload, Get

### Zoho Mail Trigger

Polls a folder for new messages using a hybrid cursor (`lastReceivedTime` + `seenMessageIds`) to avoid duplicates. Optionally fetch historical messages on first activation.

## License

MIT
