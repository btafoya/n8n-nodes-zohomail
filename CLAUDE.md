## Hard rules (do not violate without explicit permission)

- **No git actions without explicit permission.** Never `commit`, `push`,
  `checkout`, `reset`, `stash`, or any other git write. Ask first, every
  time. Read-only inspection (`git status`, `git diff`, `git log`) is fine.
- **Never create a branch unless explicitly told to.** Work on the current
  branch. Do not `git branch`, `git checkout -b`, or `git switch -c` on your own
  initiative — even when committing/pushing was authorized, that authorization
  never implies a new branch. When a commit is authorized and you're on the
  default branch, commit there; branch only on an explicit instruction.
- **Do not remove or weaken requirements from the design.** `docs/design.md`
  is the contract. Do not drop a decision, phase, table, column, skip-rule, or the
  hybrid DB path to make code simpler. If a requirement seems wrong or removable,
  stop and ask — don't silently cut it.
- Per global rules: no AI attribution in commits/code, never commit `.env` — keep it
  gitignored.

## Project overview

This is an n8n community node package (`n8n-nodes-zohomail`) for Zoho Mail. The
package contains:

- One OAuth2 credential: `zohoMailOAuth2Api`
- One action node: `ZohoMail`
- One polling trigger node: `ZohoMailTrigger`
- Shared `transport/` helper + types used by both nodes

Architecture and requirements are in `docs/design.md`. Do not weaken or remove
any requirement from that document without explicit permission.

## Common commands

| Task | Command |
|------|---------|
| Scaffold / initial setup | `npm create @n8n/node@latest n8n-nodes-zohomail -- --template programmatic` |
| Install deps | `npm install` |
| Build | `npm run build` (uses `n8n-node build`) |
| Dev loop | `npx n8n-node dev` — runs a local n8n preview at `localhost:5678` with hot reload |
| Lint | `npm run lint` (uses `n8n-node lint`) |
| Format | `npm run format` |
| Smoke test driver | `ZOHO_ACCESS_TOKEN=… ./.claude/skills/run-zoho-mail-api/driver.sh accounts` |
| Publish | `npm version patch && git push --follow-tags` (workflow publishes via `publish.yml`) |

For local install into a running n8n instance: `cd /path/to/n8n && npm install /path/to/n8n-nodes-zohomail`.

## Tooling (use during development)

- **n8n-node CLI** (`@n8n/node-cli`) — official tool for building community nodes:
  - `n8n-node build` — compiles TypeScript and bundles assets (mapped to `npm run build`).
  - `n8n-node dev` — starts a local n8n instance with this node loaded, watches files,
    and rebuilds on changes. Access at `http://localhost:5678`.
  - `n8n-node lint` — checks node code against n8n lint rules (mapped to `npm run lint`).
  - `n8n-node release` — publishes via `release-it` (build, lint, changelog, tag, GitHub release).
    Prefer the `npm-publish` skill for this repo instead.
- **Skills** (`.claude/skills/`): apply during implementation —
  - `nodejs-development` — Node.js n8n-compatible version. Use when writing `src/`.
  - `ponytail` — laziest-that-works; default mode. Don't over-engineer.
  - `anti-slop` — run before finalizing code/docs to strip generic AI patterns.
  - `n8n-mcp-tools-expert` — consult before using n8n-mcp tools (search, validate, workflows).
- **context7** — fetch current docs for n8n libraries before coding against them
  (`n8n-workflow`, `@n8n/node-cli`, etc.). Prefer it over web search and over
  memory for API syntax.
- **codegraph** (`codegraph_*`) — once `src/` exists, use for structural queries
  (definitions, callers, impact) instead of grep. `.codegraph/` may need
  `codegraph init` first — ask before running it.

## Zoho Mail API gotchas

- **OAuth header format** is `Authorization: Zoho-oauthtoken {access_token}`, not `Bearer`.
- **Data center drives both auth and API hosts.** The credential stores only the
  region (`us`, `eu`, `in`, `au`, `jp`, `ca`, `cn`, `ae`, `sa`). The node derives
  `accounts.zoho.{dc}` and `mail.zoho.{dc}` at runtime.
- **Scopes are static and broad:** `ZohoMail.accounts.ALL,ZohoMail.messages.ALL,ZohoMail.folders.ALL,ZohoMail.tags.ALL`.
  `tags` is included preemptively so label operations work without reconnecting.
- **`PUT /api/accounts/{accountId}/updatemessage` handles most state changes.**
  The payload `mode` determines the action: `markAsRead`, `markAsUnread`, `moveMessage`,
  `setFlag`, `applyLabel`, `removeLabel`, `removeAllLabels`, `archiveMails`,
  `unArchiveMails`, `moveToSpam`, `markNotSpam`. Node exposes these as separate
  operations for clarity.
- **`replyToAll` is client-side.** The REST API only has `action: "reply"`; when
  the user toggles reply-to-all, expand the original `toAddress`/`ccAddress` in
  the outgoing payload.
- **Timestamp normalization.** Some Zoho responses use lowercase `receivedtime`;
  normalize both `receivedTime` and `receivedtime` to the canonical `receivedTime`
  before using it (especially in the trigger cursor).
- **Trigger cursor is hybrid.** Store `lastReceivedTime` plus `seenMessageIds` for
  messages sharing the same timestamp to avoid duplicates.
- **No runtime dependencies.** The package must have zero runtime dependencies
  (NFR-1 in `docs/design.md`); use `n8n-workflow` helpers only.

## Suggested implementation order

1. Scaffold package with `npm create @n8n/node@latest`.
2. Implement shared `transport/` + `types.ts`.
3. Implement `ZohoMailOAuth2Api.credentials.ts`.
4. Implement read-only operations: account, folder, message get/search.
5. Probe the live API with the smoke-test driver to confirm open edge cases.
6. Implement state-changing message operations (send, reply, delete, updatemessage modes).
7. Implement attachment operations.
8. Implement `ZohoMailTrigger` with the hybrid cursor.
9. README + smoke tests.
10. Publish v0.1.0.