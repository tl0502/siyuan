# Official Feature Removal Round 1 Design

## Goal

Safely remove the first batch of upstream SiYuan official-service features from this personal fork by hiding user-facing entry points and disabling backend calls that would contact official services.

## Scope

Round 1 removes or disables these feature groups:

1. Account, membership, VIP, subscription, free trial, activation code, login, 2FA login, and deactivation entry points.
2. Official update checking, official announcements, and automatic installer package download.
3. Official website, download, community, support, and feedback links exposed in the UI.
4. Official cloud AI proxy path through `CloudChatGPT`.

Round 1 explicitly does not remove these feature groups:

1. Online bazaar implementation, except no new bazaar changes in this round.
2. Sync implementation, including `ProviderSiYuan`, S3, WebDAV, and Local File System providers.
3. Local plugin runtime and local installed package handling.
4. Local publish service and publish access control.
5. Source comments that only contain upstream issue links.
6. README/API/changelog documentation cleanup.

## Architecture

The implementation should prefer reversible, low-risk changes:

- Frontend entry points are hidden or removed from navigation, top bars, mobile menus, and settings panels.
- Backend official-service APIs return deterministic disabled responses or become no-op where background jobs would otherwise contact official services.
- Existing local and third-party functionality stays intact. OpenAI/Azure self-configured AI remains available; only the official SiYuan cloud AI path is disabled.
- Large file deletion and broad dependency removal are outside Round 1 and require a separate verified scope after the UI and API behavior are stable.

## Components

### Account And Membership UI

Affected files:

- `app/src/config/index.ts`
- `app/src/config/account.ts`
- `app/src/layout/topBar.ts`
- `app/src/mobile/menu/index.ts`
- `app/src/mobile/settings/account.ts`
- `kernel/conf/account.go`

Required behavior:

- The Settings dialog no longer shows the Account tab.
- The desktop top bar no longer renders `toolbarVIP` account/VIP controls.
- The mobile menu no longer shows login/account actions.
- Existing user data in config should not be destructively deleted.
- Account display defaults should be disabled for new configs: `DisplayTitle=false`, `DisplayVIP=false`.

### Account Backend

Affected files:

- `kernel/api/account.go`
- `kernel/api/setting.go`
- `kernel/model/cloud_service.go`
- `kernel/api/router.go` if route-level disabling is cleaner than handler-level disabling.

Required behavior:

- Account endpoints do not contact official cloud services.
- Calls to login, 2FA login, activation code checks, activation code use, free trial, and deactivation return a clear disabled-service result.
- Periodic user refresh and subscription-reminder work does not contact official cloud services.

### Update And Announcement System

Affected files:

- `app/src/config/about.ts`
- `kernel/api/system.go`
- `kernel/model/updater.go`
- `kernel/model/cloud_service.go`
- `kernel/conf/system.go` if default installer-download settings need adjustment.

Required behavior:

- The About page no longer exposes Check Update or automatic installer download controls.
- `/api/system/checkUpdate` does not contact official release endpoints.
- Automatic installer package download does not run in background jobs.
- Official announcement refresh does not contact official endpoints.

### Official Links

Affected files:

- `app/electron/init.html`
- `app/electron/error.html`
- `app/electron/main.js`
- `app/src/config/util/about.ts`
- `app/src/layout/status.ts`
- `app/src/menus/workspace.ts`
- `app/src/mobile/menu/index.ts`
- `app/src/config/appearance.ts`
- `app/src/constants.ts`

Required behavior:

- User-facing official website, official download, official community, support, feedback, and code-snippet links are removed or replaced with inert/local text.
- Electron user-agent strings no longer advertise `https://b3log.org/siyuan`.
- The default public assets address no longer points to `https://assets.b3logfile.com/siyuan/` if it is only used as an official fallback.
- Comments containing upstream issue links are not changed in this round.

### Official Cloud AI

Affected files:

- `kernel/model/cloud_service.go`
- `kernel/model/ai.go` if needed to prevent calls into `CloudChatGPT`.
- `kernel/api/ai.go` if needed to normalize disabled responses.

Required behavior:

- `CloudChatGPT` does not call `/apis/siyuan/ai/chatGPT`.
- Self-hosted/user-provided OpenAI or Azure configuration remains available.
- AI endpoints that depend on user-provided API keys keep their current behavior.

## Error Handling

- Disabled official-service endpoints should use existing response conventions where possible.
- User-facing messages should be short and deterministic. Preferred English message: `Official service is disabled in this fork.`
- Do not panic or return transport-level failures for intentionally disabled features.
- Background jobs should silently skip official-service work or log a concise disabled message.

## Testing And Verification

Minimum verification for Round 1:

- TypeScript build or project frontend check, using the repository's existing command if available.
- Go test or Go build for affected kernel packages.
- Search verification that user-facing official service entry points no longer remain for Round 1 categories.
- Manual source review of exclusions to confirm bazaar, sync, local plugins, local publish, and source comments were not broadly removed.

Suggested search checks:

- `toolbarVIP`
- `/api/account/login`
- `startFreeTrial`
- `checkUpdateBtn`
- `downloadInstallPkg`
- `CloudChatGPT`
- `b3log.org/siyuan`
- `ld246.com/article/1649901726096`
- `liuyun.io/article/1686530886208`

## Acceptance Criteria

1. Users cannot open account, VIP, subscription, trial, activation, or login UI from desktop or mobile navigation.
2. Backend account endpoints do not perform official cloud HTTP requests.
3. Users cannot trigger official update checks, official announcement fetches, or official installer package downloads.
4. User-facing official support, feedback, community, official website, and official download links are removed or made inert.
5. Official cloud AI proxy calls are disabled.
6. User-provided OpenAI/Azure AI, local editing, local files, search, export, plugin runtime, local publish, and non-official sync code are not intentionally removed in this round.
7. Existing unrelated worktree changes in `.gitignore` and `app/electron/main.js` are not reverted or overwritten.

## Risks

- `app/src/config/index.ts` settings tabs are shared; removing account entries must not break tab switching or search.
- `app/src/layout/topBar.ts` uses hide-element state; removing `toolbarVIP` must not break toolbar customization.
- `app/src/mobile/menu/index.ts` contains both account and support links; edits must preserve unrelated mobile menu actions.
- `kernel/model/cloud_service.go` mixes account, announcements, cloud AI, upload tokens, and other cloud helpers; changes should be narrow.
- `app/electron/main.js` already has unrelated local modifications; edits must avoid touching the existing port logic.
