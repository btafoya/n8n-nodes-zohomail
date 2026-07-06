# Changelog

## 0.1.7 - 2026-07-06

### Added
- Account dropdown in ZohoMail and ZohoMailTrigger nodes, populated from `/api/accounts` with labels like `email (accountId)`.

## 0.1.6 - 2026-07-06

### Fixed
- Change Zoho OAuth credential `authUrl` and `accessTokenUrl` from expression-derived hidden fields to explicit options dropdowns, avoiding `Invalid URL` errors during credential connection on n8n 2.28.

## 0.1.5 - 2026-07-06

### Fixed
- Replace `NodeConnectionTypes.Main` and `cronNodeOptions` imports with compatible literals for older `n8n-workflow` versions, resolving `Class could not be found` install errors on n8n 2.28.

## 0.1.4 - 2026-07-06

### Fixed
- Correct `unflag` operation payload, polling interval handling, `loadOptions` references, and attachment upload shape.
- Fix `LIcense` filename extension.

### Changed
- README updated for scoped package name `@btafoya/n8n-nodes-zohomail`.
- Project `CLAUDE.md` removed from repository.

### Added
- n8n community node installation instructions in README.
- MIT license.
- n8n-node CLI commands and changelog link in README.

## 0.1.3 - 2026-07-06

### Changed
- Published as scoped package `@btafoya/n8n-nodes-zohomail` to avoid npm naming conflict with `n8n-nodes-zoho-mail`.

### Added
- Initial release of n8n-nodes-zohomail.
- ZohoMail action node with account, folder, message, and label operations.
- ZohoMailTrigger polling trigger for new messages.
- ZohoMailOAuth2Api credential supporting multiple Zoho data centers.
