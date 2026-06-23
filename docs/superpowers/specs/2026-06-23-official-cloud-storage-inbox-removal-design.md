# Official Cloud Storage And Inbox Removal Design

## Goal

Make this fork stop depending on upstream paid cloud services for the remaining user-visible official cloud storage and inbox features.

This round focuses on two functional areas:

- Official cloud storage service surfaces in sync settings, including official cloud space, backup, traffic, CDN, exchange size, and purge UI/API paths.
- Official cloud inbox, including desktop/mobile dock entry points, command/hotkey entry points, and `/api/inbox/*` backend operations.

## Current State

Previous rounds already disabled official account services, official account UI, official update/support links, account modules, and the official SiYuan sync provider. S3, WebDAV, Local File System sync, plugin runtime, bazaar, and local publish are intentionally preserved.

Remaining official-service dependencies found in this round:

- `kernel/api/repo.go:getCloudSpace` exposes `/api/cloud/getCloudSpace`.
- `kernel/model/repository.go:GetCloudSpace` and `getCloudSpace` call repository cloud stat paths.
- `app/src/config/repos.ts` still contains official cloud storage and backup labels and a cloud purge action.
- `kernel/api/inbox.go` exposes `/api/inbox/getShorthands`, `/api/inbox/getShorthand`, and `/api/inbox/removeShorthands`.
- `kernel/model/cloud_service.go` implements inbox operations through upstream `/apis/siyuan/inbox/*` endpoints.
- `app/src/layout/dock/Inbox.ts`, dock registration, command lists, and mobile templates expose inbox UI and can trigger official inbox API calls.
- Several of these paths still use `needSubscribe`, `IsSubscriber`, or paid-service messaging, which creates incorrect subscription prompts in this fork.

## Design

Use the approved "UI hidden + API disabled" approach.

Backend API routes stay registered for compatibility with old clients, old layouts, plugins, and stale requests. They must return the existing `ErrOfficialServiceDisabled` error instead of contacting upstream official services.

Frontend user-visible official inbox and official cloud storage surfaces are removed or made inert. Users should not be invited to subscribe, open official cloud dashboards, query official cloud space, or use official cloud inbox.

Third-party and local sync remain available:

- S3 provider configuration and import/export remain available.
- WebDAV provider configuration and import/export remain available.
- Local File System provider configuration remains available.
- Cloud sync directory configuration remains available for supported non-official providers.
- General sync enablement, conflict document generation, sync mode, and sync interval remain available.

## Backend Requirements

### Official Cloud Storage

- `/api/cloud/getCloudSpace` remains registered but returns a disabled official-service result.
- `model.GetCloudSpace()` returns `ErrOfficialServiceDisabled`.
- `model.GetCloudSpace()` must not call `newRepository()` or any official cloud repository/stat path.
- Official cloud purge UI is removed. `model.PurgeCloud()` is not changed in this round because it can operate on the currently selected non-official sync repository; removing the UI action avoids presenting it as official cloud storage.

### Inbox

- `model.GetCloudShorthands(page)`, `model.GetCloudShorthand(id)`, and `model.RemoveCloudShorthands(ids)` return `ErrOfficialServiceDisabled`.
- These functions must not create cloud requests or call `util.GetCloudServer()`.
- `/api/inbox/*` handlers remain registered but return the disabled error from the model layer.

## Frontend Requirements

### Sync Settings Cloud Storage

- Remove the official cloud storage summary and traffic loading block from `app/src/config/repos.ts`.
- Remove the static official `cloudBackup` row from sync settings.
- Remove the official cloud purge action from sync settings.
- Keep S3/WebDAV/Local provider panels, save flows, import/export for S3/WebDAV, and cloud sync directory controls.
- Remove subscription-gated show/hide behavior for these removed official cloud storage surfaces.

### Inbox UI

- Remove inbox from visible dock definitions and command lists.
- Remove mobile sidebar inbox tab and content container.
- Prevent desktop dock creation from instantiating `Inbox`.
- Keep compatibility types only if removing them would cause broad type churn; visible UI and command entry points must be gone.
- Existing stale requests to `/api/inbox/*` are handled by backend disabled errors.

## Subscription Cleanup Boundary

This round removes subscription checks only where they are attached to official cloud storage and official inbox behavior.

This round does not remove all paid-feature checks across the product. Existing checks for preserved non-official sync providers may remain until a later policy decision, because removing them broadly could change unrelated behavior.

## Non-Goals

- Do not remove S3, WebDAV, or Local File System sync.
- Do not remove bazaar or plugin runtime.
- Do not remove local publish.
- Do not remove general sync entry points.
- Do not do client packaging.
- Do not clean unrelated CDN uses for rendering libraries such as Mermaid, KaTeX, ECharts, or Graphviz.

## Testing And Verification

Backend tests should prove that:

- `model.GetCloudSpace()` returns `ErrOfficialServiceDisabled`.
- `model.GetCloudShorthands`, `model.GetCloudShorthand`, and `model.RemoveCloudShorthands` return `ErrOfficialServiceDisabled`.
- The disabled tests pass without network access and without requiring a configured user account.

Frontend verification should prove that:

- Sync settings no longer include official cloud backup, official cloud storage summary, traffic stat, or cloud purge UI.
- Inbox is no longer present in dock definitions, command lists, or mobile sidebar templates.
- S3/WebDAV/Local sync configuration strings and routes remain present.

Build/test verification:

- Run focused Go tests for official disabled behavior.
- Run affected Go package tests with vet disabled if the repository's existing vet baseline still blocks normal `go test`.
- Run frontend type/build verification only as a build check. Do not package desktop or mobile clients.

## Rollout

Implement in two commits:

1. Backend official cloud storage and inbox API disablement with tests.
2. Frontend removal of official cloud storage and inbox entry points.

After implementation, run residual searches for official cloud storage, inbox, and preserved S3/WebDAV/Local sync terms before final reporting.
