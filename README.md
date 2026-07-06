# @btafoya/n8n-nodes-zohomail

[![npm version](https://img.shields.io/npm/v/@btafoya/n8n-nodes-zohomail.svg)](https://www.npmjs.com/package/@btafoya/n8n-nodes-zohomail)
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

Community nodes can only be installed on **self-hosted** n8n instances. They are not available on n8n Cloud.

### Install from the n8n GUI

1. Open your n8n instance and go to **Settings > Community Nodes**.
2. Select **Install**.
3. Enter the npm package name: `@btafoya/n8n-nodes-zohomail`.
   - You can also append a version or dist-tag, for example `@btafoya/n8n-nodes-zohomail@1.2.3`.
4. Check **I understand the risks of installing unverified code from a public source**.
5. Select **Install**. n8n installs the node and adds it to the **Community Nodes** list.

### Install manually with npm

Use this method when your n8n instance runs in queue mode or when you want to install private packages.

From inside your n8n installation or container:

```bash
mkdir -p ~/.n8n/nodes
cd ~/.n8n/nodes
npm i @btafoya/n8n-nodes-zohomail
```

Then restart n8n.

Other useful commands:

```bash
npm uninstall @btafoya/n8n-nodes-zohomail
npm update @btafoya/n8n-nodes-zohomail
npm install @btafoya/n8n-nodes-zohomail@1.2.3
```

### Install from a local build

```bash
cd /path/to/n8n
npm install /path/to/n8n-nodes-zohomail
```

### Install with environment variables

Available from n8n v2.21.0. Set the following environment variables on your n8n instance, then restart:

```bash
export N8N_COMMUNITY_PACKAGES_ENABLED=true
export N8N_COMMUNITY_PACKAGES_MANAGED_BY_ENV=true
export N8N_COMMUNITY_PACKAGES='[{"name":"@btafoya/n8n-nodes-zohomail"}]'
```

In `docker-compose.yml`:

```yaml
environment:
  - N8N_COMMUNITY_PACKAGES_ENABLED=true
  - N8N_COMMUNITY_PACKAGES_MANAGED_BY_ENV=true
  - 'N8N_COMMUNITY_PACKAGES=[{"name":"@btafoya/n8n-nodes-zohomail"}]'
```

> **Warning:** Enabling `N8N_COMMUNITY_PACKAGES_MANAGED_BY_ENV=true` uninstalls any community packages that are not listed in `N8N_COMMUNITY_PACKAGES` on startup.

## Development

```bash
npm install
npm run build   # n8n-node build — compile TypeScript and bundle assets
npm run dev     # n8n-node dev — local n8n preview with hot reload at http://localhost:5678
npm run lint    # n8n-node lint — check code against n8n community node rules
```

## Changelog

See [CHANGELOG.md](./CHANGELOG.md).

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
