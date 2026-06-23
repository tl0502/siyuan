# Official Sync Provider Removal Round 2 Design

## Goal

Round 2 disables the upstream SiYuan official cloud sync provider while preserving non-official sync capabilities. The fork should not default to, expose, or accidentally contact SiYuan official sync infrastructure, but S3, WebDAV, and Local File System sync should remain usable.

## Scope

Round 2 removes or disables these feature groups:

1. `ProviderSiYuan` as a selectable frontend sync provider.
2. New-config defaulting to the official provider.
3. Backend calls that manage official cloud sync directories.
4. Official sync WebSocket connection startup.
5. Automatic sync attempts when the active provider is still `ProviderSiYuan` in an existing config.

Round 2 explicitly does not remove these feature groups:

1. S3 sync configuration, import, export, purge, and sync execution.
2. WebDAV sync configuration, import, export, purge, and sync execution.
3. Local File System sync configuration and sync execution.
4. General sync UI entry points such as the top bar sync button and mobile sync action.
5. Local plugin runtime, online bazaar, local publish, and documentation cleanup.

## Architecture

The implementation should prefer narrow, reversible changes:

- Frontend settings stop offering `SiYuan` as a provider and render existing `ProviderSiYuan` configs as disabled/inert.
- Backend provider selection rejects `ProviderSiYuan` with a deterministic disabled-service result.
- Official cloud directory APIs return disabled results when they would require official cloud sync.
- Sync execution short-circuits when the configured provider is `ProviderSiYuan`, preventing old configs from reaching official services.
- Existing provider constants may remain for config compatibility and migration checks; deleting the constant is out of scope.

## Components

### Sync Configuration Defaults

Affected files:

- `kernel/conf/sync.go`
- `kernel/model/conf.go` if existing config normalization needs a compatibility migration.

Required behavior:

- New sync config should no longer default to `ProviderSiYuan`.
- Preferred default is `ProviderLocal` with sync still disabled, because it does not need credentials or official services.
- Existing configs with `ProviderSiYuan` should be treated as disabled official sync until the user selects S3, WebDAV, or Local.

### Sync Provider Settings UI

Affected files:

- `app/src/config/repos.ts`
- `app/src/sync/syncGuide.ts` if cloud sync directory UI assumes the official provider.

Required behavior:

- The provider dropdown no longer lists `SiYuan`.
- Provider-specific intro and cloud-space quota UI for official SiYuan sync is removed or replaced by an inert disabled message.
- S3, WebDAV, and Local provider panels keep their existing fields and save behavior.
- Cloud sync directory selection should not call official directory APIs when provider is disabled or non-official.

### Sync Backend API

Affected files:

- `kernel/api/sync.go`
- `kernel/model/sync.go`
- `kernel/model/repository.go` if sync execution must explicitly block official provider.

Required behavior:

- `setSyncProvider` rejects `ProviderSiYuan`.
- `CreateCloudSyncDir`, `RemoveCloudSyncDir`, `ListCloudSyncDir`, and `SetCloudSyncDir` do not contact official services for `ProviderSiYuan`.
- `performSync` and repository sync paths return a clear disabled-service error when the active provider is `ProviderSiYuan`.
- S3, WebDAV, and Local code paths keep current behavior.

### Sync Background And Resume Behavior

Affected files:

- `kernel/model/sync.go`
- `app/electron/main.js` only if frontend-side resume behavior needs provider gating.

Required behavior:

- Official sync WebSocket never starts.
- Resume-triggered sync should be harmless if an old config still has `ProviderSiYuan`; backend short-circuiting is sufficient.
- No broad changes to Electron resume behavior are required if backend blocking is deterministic.

## Error Handling

- Reuse the existing `model.ErrOfficialServiceDisabled` message from Round 1 where available.
- API responses should follow existing `gulu.Result` conventions: `Code = -1`, `Msg = ErrOfficialServiceDisabled.Error()` for intentionally disabled official sync operations.
- UI should surface existing backend error messages without adding new official-service copy.
- Background paths should return or log concisely instead of panic.

## Testing And Verification

Minimum verification for Round 2:

- Focused Go tests for provider selection and official sync API/model disablement.
- Go package verification for affected kernel packages. If normal `go test` is blocked by the existing vet baseline, run the same package set with `-vet=off` and report the baseline blocker.
- Frontend production builds:
  - `pnpm run build:desktop`
  - `pnpm run build:mobile`
- Search verification:
  - `ProviderSiYuan` remains only for compatibility, disabled checks, or explicit tests.
  - The frontend no longer offers `<option value="0">SiYuan</option>`.
  - S3/WebDAV/Local provider strings and endpoints remain present.
  - Bazaar, plugin runtime, and publish service references remain present.

## Acceptance Criteria

1. New configs do not default to official SiYuan sync.
2. Users cannot select official SiYuan sync in the settings UI.
3. Existing configs with `ProviderSiYuan` do not contact official sync endpoints.
4. Official cloud sync directory APIs return disabled results.
5. Official sync WebSocket is not started.
6. S3, WebDAV, and Local File System sync remain configurable and build successfully.
7. Sync entry points remain available for non-official providers.
8. Online bazaar, local plugins, and local publish are not intentionally changed.

## Risks

- Existing configs may still contain `ProviderSiYuan`; backend blocking must handle this without crashing.
- `syncGuide.ts` is shared by desktop, mobile, hotkeys, and command palette; edits must preserve the general sync action for non-official providers.
- Repository sync code has multiple provider branches; changes should add explicit official-provider guards rather than refactor shared sync logic.
- Some naming such as `CloudName` and `cloud sync dir` is shared across providers and should not be renamed in this round.
