# Official Cloud Storage And Inbox Removal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Disable official cloud storage and cloud inbox dependencies while preserving S3, WebDAV, Local File System sync, bazaar, plugins, and local publish.

**Architecture:** Keep backend API routes for compatibility, but make model functions return `ErrOfficialServiceDisabled` before any upstream request or official repository construction. Remove user-visible official cloud storage and inbox entry points from the frontend, while leaving compatibility types in place where removing them would create broad churn.

**Tech Stack:** Go kernel under `kernel`, TypeScript frontend under `app/src`, existing `go test` and `pnpm` build scripts.

---

## Current Worktree Guard

Before each commit, run:

```powershell
git status --short
```

Stage only the files listed in that task. Do not touch bazaar, plugin runtime, local publish, renderer CDN library loading, docs outside this plan/spec, or client packaging.

## File Structure

- `kernel/model/official_cloud_storage_inbox_disabled_test.go`: focused tests for disabled official cloud storage and inbox model functions.
- `kernel/model/repository.go`: returns disabled error from `GetCloudSpace`.
- `kernel/model/cloud_service.go`: returns disabled errors from cloud inbox functions before network access.
- `app/src/config/repos.ts`: removes official cloud storage/backup/purge surfaces from sync settings.
- `app/src/constants.ts`: removes inbox from default dock layout.
- `app/src/assets/template/mobile/index.tpl`: removes mobile inbox sidebar tab and panel.
- `app/src/boot/globalEvent/commonHotkey.ts`: removes inbox from common panel hotkey handling.
- `app/src/boot/globalEvent/command/panel.ts`: removes inbox from panel command lists.
- `app/src/boot/globalEvent/command/global.ts`: removes inbox command handling.
- `app/src/layout/dock/index.ts`: prevents dock manager from creating an Inbox model.
- `app/src/mobile/util/initFramework.ts`: prevents mobile sidebar from creating an Inbox model.

---

### Task 1: Backend Official Cloud Storage And Inbox Disablement

**Files:**
- Create: `kernel/model/official_cloud_storage_inbox_disabled_test.go`
- Modify: `kernel/model/repository.go`
- Modify: `kernel/model/cloud_service.go`

- [ ] **Step 1: Write failing model tests**

Create `kernel/model/official_cloud_storage_inbox_disabled_test.go`:

```go
package model

import (
	"errors"
	"testing"

	"github.com/siyuan-note/siyuan/kernel/conf"
)

func withOfficialServiceTestConf(t *testing.T, fn func()) {
	t.Helper()

	oldConf := Conf
	Conf = NewAppConf()
	Conf.System = conf.NewSystem()
	Conf.Repo = conf.NewRepo()
	Conf.Sync = conf.NewSync()
	Conf.Sync.Provider = conf.ProviderLocal
	Conf.Sync.CloudName = "main"
	t.Cleanup(func() {
		Conf = oldConf
	})

	fn()
}

func TestOfficialCloudStorageDisabled(t *testing.T) {
	withOfficialServiceTestConf(t, func() {
		sync, backup, hSize, hAssetSize, hTotalSize, hExchangeSize, hTrafficUploadSize, hTrafficDownloadSize, hTrafficAPIGet, hTrafficAPIPut, err := GetCloudSpace()
		if !errors.Is(err, ErrOfficialServiceDisabled) {
			t.Fatalf("GetCloudSpace() error = %v, want ErrOfficialServiceDisabled", err)
		}
		if sync != nil || backup != nil || hSize != "" || hAssetSize != "" || hTotalSize != "" || hExchangeSize != "" ||
			hTrafficUploadSize != "" || hTrafficDownloadSize != "" || hTrafficAPIGet != "" || hTrafficAPIPut != "" {
			t.Fatalf("GetCloudSpace() returned data with disabled error")
		}
	})
}

func TestOfficialInboxDisabled(t *testing.T) {
	withOfficialServiceTestConf(t, func() {
		if err := RemoveCloudShorthands([]string{"1"}); !errors.Is(err, ErrOfficialServiceDisabled) {
			t.Fatalf("RemoveCloudShorthands() error = %v, want ErrOfficialServiceDisabled", err)
		}
		if shorthand, err := GetCloudShorthand("1"); !errors.Is(err, ErrOfficialServiceDisabled) || shorthand != nil {
			t.Fatalf("GetCloudShorthand() = (%v, %v), want nil and ErrOfficialServiceDisabled", shorthand, err)
		}
		if shorthands, err := GetCloudShorthands(1); !errors.Is(err, ErrOfficialServiceDisabled) || shorthands != nil {
			t.Fatalf("GetCloudShorthands() = (%v, %v), want nil and ErrOfficialServiceDisabled", shorthands, err)
		}
	})
}
```

- [ ] **Step 2: Run tests to verify RED**

Run from `kernel`:

```powershell
go test -vet=off ./model -run "TestOfficial(CloudStorage|Inbox)Disabled" -count=1
```

Expected: FAIL because `GetCloudSpace` and inbox functions are not yet consistently disabled.

- [ ] **Step 3: Disable cloud storage stat model function**

In `kernel/model/repository.go`, replace the body of `GetCloudSpace` with an immediate disabled return:

```go
func GetCloudSpace() (s *Sync, b *Backup, hSize, hAssetSize, hTotalSize, hExchangeSize, hTrafficUploadSize, hTrafficDownloadSize, hTrafficAPIGet, hTrafficAPIPut string, err error) {
	err = ErrOfficialServiceDisabled
	return
}
```

Leave `getCloudSpace` in place for now if it remains referenced by older code comments or future cleanup searches; the acceptance criterion is that public model/API entry no longer reaches it.

- [ ] **Step 4: Disable cloud inbox model functions**

In `kernel/model/cloud_service.go`, replace the bodies of the three inbox functions with disabled returns:

```go
func RemoveCloudShorthands(ids []string) (err error) {
	return ErrOfficialServiceDisabled
}

func GetCloudShorthand(id string) (ret map[string]any, err error) {
	err = ErrOfficialServiceDisabled
	return
}

func GetCloudShorthands(page int) (result map[string]any, err error) {
	err = ErrOfficialServiceDisabled
	return
}
```

After this change, remove imports from `cloud_service.go` that become unused.

- [ ] **Step 5: Format Go files**

Run from repo root:

```powershell
gofmt -w kernel/model/repository.go kernel/model/cloud_service.go kernel/model/official_cloud_storage_inbox_disabled_test.go
```

Expected: command exits 0.

- [ ] **Step 6: Run focused backend tests**

Run from `kernel`:

```powershell
go test -vet=off ./model -run "TestOfficial(CloudStorage|Inbox|SyncProvider|Account|Update|CloudAI)" -count=1
```

Expected: PASS.

- [ ] **Step 7: Commit backend disablement**

Run from repo root:

```powershell
git status --short
git add -- kernel/model/repository.go kernel/model/cloud_service.go kernel/model/official_cloud_storage_inbox_disabled_test.go
git commit -m "chore: disable official cloud storage and inbox APIs"
```

Expected: commit includes only the backend files above.

---

### Task 2: Frontend Official Cloud Storage And Inbox Entry Removal

**Files:**
- Modify: `app/src/config/repos.ts`
- Modify: `app/src/constants.ts`
- Modify: `app/src/assets/template/mobile/index.tpl`
- Modify: `app/src/boot/globalEvent/commonHotkey.ts`
- Modify: `app/src/boot/globalEvent/command/panel.ts`
- Modify: `app/src/boot/globalEvent/command/global.ts`
- Modify: `app/src/layout/dock/index.ts`
- Modify: `app/src/mobile/util/initFramework.ts`

- [ ] **Step 1: Remove official cloud storage UI from sync settings**

In `app/src/config/repos.ts`:

1. Remove the `getReposDataLoadingHTML` helper if it is no longer referenced.
2. Remove the `reposData` block from `repos.genHTML`.
3. In `bindProviderEvent`, remove `const reposDataElement = ...`, the sibling show/hide loop based on `isPaidUser()`, and `reposDataElement.classList.add("fn__none")`.
4. Remove the static `cloudBackup` row:

```ts
<div class="b3-label fn__flex">
    <div class="fn__flex-center">${window.siyuan.languages.cloudBackup}</div>
    <div class="b3-list-item__meta fn__flex-center">${window.siyuan.languages.cloudBackupTip}</div>
</div>
```

5. Remove the `purgeData` click branch that calls `/api/repo/purgeCloudRepo`.

Keep the S3/WebDAV/Local provider panels and `cloudStoragePurge` buttons inside provider-specific panels only if they are tied to the selected non-official repository. If those buttons still call `/api/repo/purgeCloudRepo`, remove their rendered buttons too.

- [ ] **Step 2: Remove inbox from default dock constants**

In `app/src/constants.ts`, remove this object from the default dock list:

```ts
{
    type: "inbox",
    size: {width: 320, height: 0},
    show: false,
    icon: "iconInbox",
    hotkeyLangId: "inbox",
}
```

- [ ] **Step 3: Remove mobile inbox sidebar template**

In `app/src/assets/template/mobile/index.tpl`, remove:

```html
<svg data-type="sidebar-inbox-tab" class="toolbar__icon"><use xlink:href="#iconInbox"></use></svg>
```

and remove:

```html
<div class="fn__flex-column fn__none" data-type="sidebar-inbox"></div>
```

- [ ] **Step 4: Remove inbox from command and hotkey entry points**

In `app/src/boot/globalEvent/commonHotkey.ts`, remove `"inbox"` from the panel/dock hotkey array.

In `app/src/boot/globalEvent/command/panel.ts`, remove `"inbox"` from both `keys = [...]` arrays.

In `app/src/boot/globalEvent/command/global.ts`, remove both `case "inbox":` branches. If a branch handles multiple cases, remove only the inbox case label and keep the other cases.

- [ ] **Step 5: Prevent dock creation of Inbox**

In `app/src/layout/dock/index.ts`:

1. Remove `"inbox"` from `const TYPES = [...]`.
2. Remove the `case "inbox":` branch that creates `new Inbox(this.app, tab)`.
3. Remove the `Inbox` import if it becomes unused.

Keep type declarations elsewhere unless TypeScript requires a narrow change.

- [ ] **Step 6: Prevent mobile sidebar from creating Inbox**

In `app/src/mobile/util/initFramework.ts`, remove the `sidebar-inbox-tab` branch:

```ts
} else if (type === "sidebar-inbox-tab" && !window.siyuan.mobile.docks.inbox) {
    window.siyuan.mobile.docks.inbox = new Inbox(app, document.querySelector('#sidebar [data-type="sidebar-inbox"]'));
```

Remove the `Inbox` import if it becomes unused.

- [ ] **Step 7: Run frontend build checks**

Run from `app`:

```powershell
pnpm run build:desktop
pnpm run build:mobile
```

Expected: both commands exit 0. Webpack asset-size warnings are acceptable. Do not run client packaging commands.

- [ ] **Step 8: Commit frontend removal**

Run from repo root:

```powershell
git status --short
git add -- app/src/config/repos.ts app/src/constants.ts app/src/assets/template/mobile/index.tpl app/src/boot/globalEvent/commonHotkey.ts app/src/boot/globalEvent/command/panel.ts app/src/boot/globalEvent/command/global.ts app/src/layout/dock/index.ts app/src/mobile/util/initFramework.ts
git commit -m "chore: hide official cloud storage and inbox UI"
```

Expected: commit includes only the frontend files above.

---

### Task 3: Final Verification And Residual Audit

**Files:**
- Modify: none expected unless verification reveals a narrow compile error.

- [ ] **Step 1: Run focused Go tests**

Run from `kernel`:

```powershell
go test -vet=off ./model -run "TestOfficial(CloudStorage|Inbox|SyncProvider|Account|Update|CloudAI)" -count=1
```

Expected: PASS.

- [ ] **Step 2: Run affected Go package verification**

Run from `kernel`:

```powershell
go test ./api ./model ./conf
```

If this fails only with the repository's existing `non-constant format string` vet baseline, run:

```powershell
go test -vet=off ./api ./model ./conf
```

Expected with vet disabled: PASS.

- [ ] **Step 3: Run frontend build checks**

Run from `app`:

```powershell
pnpm run build:desktop
pnpm run build:mobile
```

Expected: both commands exit 0. Existing webpack asset-size warnings are acceptable. Do not package desktop/mobile clients.

- [ ] **Step 4: Audit removed official surfaces**

Run from repo root:

```powershell
rg -n "getCloudSpace|GetCloudSpace|cloudBackup|trafficStat|pointExchangeSize|purgeCloudRepo|GetCloudShorthand|GetCloudShorthands|RemoveCloudShorthands|/api/inbox|getShorthands|getShorthand|removeShorthands|sidebar-inbox|iconInbox|open-menu-inbox|new Inbox|sidebar-inbox-tab" app/src kernel -g '!app/node_modules/**' -g '!app/stage/**' -g '!app/src/asset/pdf/**'
```

Expected:

- Backend function names and API routes may remain only as compatibility disabled handlers.
- No visible frontend inbox entry point remains in constants, mobile template, commands, or dock creation.
- No sync settings official cloud storage, traffic, backup, or purge UI remains.

- [ ] **Step 5: Audit preserved scopes**

Run from repo root:

```powershell
rg -n "ProviderS3|ProviderWebDAV|ProviderLocal|setSyncProviderS3|setSyncProviderWebDAV|setSyncProviderLocal|getBazaarPlugin|installBazaarPlugin|class Plugin|publishService" app/src kernel -g '!app/node_modules/**' -g '!app/stage/**' -g '!app/src/asset/pdf/**'
```

Expected: matches remain for S3, WebDAV, Local, bazaar, plugin runtime, and local publish.

- [ ] **Step 6: Final worktree review**

Run from repo root:

```powershell
git status --short
git log --oneline -10
```

Expected:

- Backend and frontend implementation commits are present.
- Worktree has no unintended uncommitted changes.

- [ ] **Step 7: Final summary**

Report:

- Official cloud storage and cloud inbox backend paths now return disabled errors.
- Official cloud storage and inbox visible UI entry points are hidden.
- S3/WebDAV/Local sync, bazaar, plugins, and local publish remain present.
- Verification commands that passed.
- Any normal `go test` vet baseline blocker if it remains.
