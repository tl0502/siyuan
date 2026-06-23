# Official Sync Provider Removal Round 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Disable the upstream SiYuan official cloud sync provider while preserving S3, WebDAV, Local File System sync, and general sync entry points.

**Architecture:** Keep `ProviderSiYuan` constants for compatibility, but make official sync inert at every runtime boundary: config defaults, provider selection, cloud sync directory operations, repository construction, sync execution, and WebSocket startup. Hide the official provider in the settings UI while leaving S3/WebDAV/Local panels and save flows intact.

**Tech Stack:** Go kernel under `kernel`, TypeScript frontend under `app/src`, existing `go test` and `pnpm` build scripts.

---

## Current Worktree Guard

Before each commit, run `git status --short` and stage only the files listed in that task. The implementation should not touch online bazaar, plugin runtime, local publish, README/API/changelog documentation, or unrelated Electron port logic.

## File Structure

- `kernel/model/official_sync_provider_disabled_test.go`: focused tests proving `ProviderSiYuan` defaults and runtime operations are disabled while provider constants remain usable for compatibility.
- `kernel/conf/sync.go`: changes new sync defaults from `ProviderSiYuan` to `ProviderLocal`.
- `kernel/model/sync.go`: rejects selecting `ProviderSiYuan`, disables official sync directory operations, blocks official provider in sync checks, and prevents official WebSocket startup.
- `kernel/model/repository.go`: prevents constructing a SiYuan official cloud repository through `newRepository`.
- `kernel/api/sync.go`: returns disabled results for official-provider manual sync and cloud sync directory APIs through model functions.
- `app/src/config/repos.ts`: removes official provider from dropdown and makes existing provider `0` render as disabled/inert while preserving S3/WebDAV/Local.
- `app/src/sync/syncGuide.ts`: avoids official cloud directory API calls when provider is disabled or not a provider that supports local directory listing.

---

### Task 1: Backend Official Sync Provider Disablement

**Files:**
- Create: `kernel/model/official_sync_provider_disabled_test.go`
- Modify: `kernel/conf/sync.go`
- Modify: `kernel/model/sync.go`
- Modify: `kernel/model/repository.go`

- [ ] **Step 1: Write failing model tests for official sync provider disablement**

Create `kernel/model/official_sync_provider_disabled_test.go`:

```go
package model

import (
	"errors"
	"testing"

	"github.com/siyuan-note/siyuan/kernel/conf"
)

func withSyncProvider(t *testing.T, provider int, enabled bool, fn func()) {
	t.Helper()

	oldConf := Conf
	Conf = &conf.Conf{
		Sync: conf.NewSync(),
	}
	Conf.Sync.Provider = provider
	Conf.Sync.Enabled = enabled
	Conf.Sync.CloudName = "main"
	t.Cleanup(func() {
		Conf = oldConf
	})

	fn()
}

func TestOfficialSyncProviderDefaultDisabled(t *testing.T) {
	sync := conf.NewSync()
	if sync.Provider != conf.ProviderLocal {
		t.Fatalf("NewSync().Provider = %d, want ProviderLocal", sync.Provider)
	}
	if sync.Enabled {
		t.Fatal("NewSync().Enabled = true, want false")
	}
}

func TestOfficialSyncProviderSelectionDisabled(t *testing.T) {
	withSyncProvider(t, conf.ProviderLocal, false, func() {
		if err := SetSyncProvider(conf.ProviderSiYuan); !errors.Is(err, ErrOfficialServiceDisabled) {
			t.Fatalf("SetSyncProvider(ProviderSiYuan) error = %v, want ErrOfficialServiceDisabled", err)
		}
		if Conf.Sync.Provider != conf.ProviderLocal {
			t.Fatalf("Conf.Sync.Provider = %d, want ProviderLocal", Conf.Sync.Provider)
		}
	})
}

func TestOfficialSyncProviderOperationsDisabled(t *testing.T) {
	withSyncProvider(t, conf.ProviderSiYuan, true, func() {
		if checkSync(false, false, true) {
			t.Fatal("checkSync with ProviderSiYuan returned true, want false")
		}
		if err := CreateCloudSyncDir("main"); !errors.Is(err, ErrOfficialServiceDisabled) {
			t.Fatalf("CreateCloudSyncDir() error = %v, want ErrOfficialServiceDisabled", err)
		}
		if err := RemoveCloudSyncDir("main"); !errors.Is(err, ErrOfficialServiceDisabled) {
			t.Fatalf("RemoveCloudSyncDir() error = %v, want ErrOfficialServiceDisabled", err)
		}
		dirs, hSize, err := ListCloudSyncDir()
		if !errors.Is(err, ErrOfficialServiceDisabled) {
			t.Fatalf("ListCloudSyncDir() error = %v, want ErrOfficialServiceDisabled", err)
		}
		if len(dirs) != 0 || hSize != "" {
			t.Fatalf("ListCloudSyncDir() = (%v, %q, %v), want empty values with disabled error", dirs, hSize, err)
		}
		if _, err := newRepository(); !errors.Is(err, ErrOfficialServiceDisabled) {
			t.Fatalf("newRepository() error = %v, want ErrOfficialServiceDisabled", err)
		}
	})
}
```

- [ ] **Step 2: Run tests to verify they fail before implementation**

Run from `kernel`:

```powershell
go test -vet=off ./model -run "TestOfficialSyncProvider" -count=1
```

Expected: FAIL because `conf.NewSync()` still defaults to `ProviderSiYuan`, `SetSyncProvider` accepts `ProviderSiYuan`, and official sync operations are not disabled.

- [ ] **Step 3: Change new sync defaults**

In `kernel/conf/sync.go`, change `NewSync`:

```go
func NewSync() *Sync {
	return &Sync{
		CloudName:           "main",
		Enabled:             false,
		Perception:          false,
		Mode:                1,
		GenerateConflictDoc: false,
		Provider:            ProviderLocal,
		Interval:            30,
	}
}
```

- [ ] **Step 4: Reject official provider selection**

In `kernel/model/sync.go`, replace `SetSyncProvider` with:

```go
func SetSyncProvider(provider int) (err error) {
	if conf.ProviderSiYuan == provider {
		return ErrOfficialServiceDisabled
	}

	Conf.Sync.Provider = provider
	Conf.Save()
	return
}
```

- [ ] **Step 5: Block official provider in sync checks**

In `kernel/model/sync.go`, update the `switch Conf.Sync.Provider` block inside `checkSync` so the official provider returns disabled without contacting official services:

```go
	switch Conf.Sync.Provider {
	case conf.ProviderSiYuan:
		if byHand {
			util.PushErrMsg(ErrOfficialServiceDisabled.Error(), 5000)
		}
		return false
	case conf.ProviderWebDAV, conf.ProviderS3, conf.ProviderLocal:
		if !IsPaidUser() {
			Conf.Sync.Enabled = false
			Conf.Save()
			return false
		}
	}
```

- [ ] **Step 6: Disable official cloud sync directory operations**

In `kernel/model/sync.go`, add early official-provider guards at the start of these functions:

```go
func SetCloudSyncDir(name string) {
	if conf.ProviderSiYuan == Conf.Sync.Provider {
		util.PushErrMsg(ErrOfficialServiceDisabled.Error(), 5000)
		return
	}

	if !cloud.IsValidCloudDirName(name) {
		util.PushErrMsg(Conf.Language(37), 5000)
		return
	}
	// keep the existing remainder
}
```

```go
func CreateCloudSyncDir(name string) (err error) {
	if conf.ProviderSiYuan == Conf.Sync.Provider {
		return ErrOfficialServiceDisabled
	}
	// keep the existing remainder
}
```

```go
func RemoveCloudSyncDir(name string) (err error) {
	if conf.ProviderSiYuan == Conf.Sync.Provider {
		return ErrOfficialServiceDisabled
	}
	// keep the existing remainder
}
```

```go
func ListCloudSyncDir() (syncDirs []*Sync, hSize string, err error) {
	if conf.ProviderSiYuan == Conf.Sync.Provider {
		err = ErrOfficialServiceDisabled
		return
	}
	// keep the existing remainder
}
```

- [ ] **Step 7: Disable official sync WebSocket startup**

In `kernel/model/sync.go`, replace the first guard in `connectSyncWebSocket`:

```go
	if !Conf.Sync.Enabled || conf.ProviderSiYuan == Conf.Sync.Provider {
		return
	}
```

Leave `dialSyncWebSocket` unchanged for compatibility unless it becomes unused; the acceptance criterion is that startup never calls it.

- [ ] **Step 8: Prevent official repository construction**

In `kernel/model/repository.go`, update `newRepository`:

```go
	switch Conf.Sync.Provider {
	case conf.ProviderSiYuan:
		err = ErrOfficialServiceDisabled
		return
	case conf.ProviderS3:
		s3HTTPClient := &http.Client{Transport: httpclient.NewTransport(cloudConf.S3.SkipTlsVerify)}
```

- [ ] **Step 9: Format Go files**

Run from repo root:

```powershell
gofmt -w kernel/conf/sync.go kernel/model/sync.go kernel/model/repository.go kernel/model/official_sync_provider_disabled_test.go
```

Expected: command exits 0.

- [ ] **Step 10: Run focused Go tests**

Run from `kernel`:

```powershell
go test -vet=off ./model -run "TestOfficialSyncProvider" -count=1
```

Expected: PASS.

- [ ] **Step 11: Commit backend official sync disablement**

Run from repo root:

```powershell
git add -- kernel/conf/sync.go kernel/model/sync.go kernel/model/repository.go kernel/model/official_sync_provider_disabled_test.go
git commit -m "chore: disable official sync provider"
```

Expected: commit succeeds and includes only these backend files.

---

### Task 2: Sync Settings UI Provider Removal

**Files:**
- Modify: `app/src/config/repos.ts`
- Modify: `app/src/sync/syncGuide.ts`

- [ ] **Step 1: Remove official provider rendering branch**

In `app/src/config/repos.ts`, replace the `provider === 0` branch at the top of `renderProvider` with an inert disabled message:

```ts
    if (provider === 0) {
        return `<div class="b3-label b3-label--inner">${window.siyuan.languages._kernel?.[29] || "Official service is disabled in this fork."}</div>`;
    }
```

If the optional indexed language access does not compile because of local type definitions, use this instead:

```ts
    if (provider === 0) {
        return `<div class="b3-label b3-label--inner">Official service is disabled in this fork.</div>`;
    }
```

- [ ] **Step 2: Remove official cloud quota/network branch**

In `app/src/config/repos.ts`, remove the whole `if (window.siyuan.config.sync.provider === 0) { ... return; }` block inside `bindProviderEvent`.

After removal, `bindProviderEvent` should continue with the existing non-official provider behavior:

```ts
    let nextElement = reposDataElement.nextElementSibling;
    while (nextElement) {
        if (isPaidUser()) {
            nextElement.classList.remove("fn__none");
        } else {
            nextElement.classList.add("fn__none");
        }
        nextElement = nextElement.nextElementSibling;
    }
```

- [ ] **Step 3: Remove SiYuan from provider dropdown**

In `app/src/config/repos.ts`, replace the provider `<select>` options with:

```ts
    <select id="syncProvider" class="b3-select fn__flex-center fn__size200">
        <option value="2" ${window.siyuan.config.sync.provider === 2 ? "selected" : ""}>S3</option>
        <option value="3" ${window.siyuan.config.sync.provider === 3 ? "selected" : ""}>WebDAV</option>
        <option class="${!["std", "docker"].includes(window.siyuan.config.system.container) ? "fn__none" : ""}" value="4" ${window.siyuan.config.sync.provider === 4 || window.siyuan.config.sync.provider === 0 ? "selected" : ""}>${window.siyuan.languages.localFileSystem}</option>
    </select>
```

This displays Local File System for existing provider `0` configs while the backend still treats provider `0` as disabled until the user saves a new provider.

- [ ] **Step 4: Make provider change fallback non-official**

In `app/src/config/repos.ts`, update the `syncProviderElement.addEventListener("change", ...)` error branch:

```ts
                if (response.code === 1 || response.code === -1) {
                    showMessage(response.msg);
                    syncProviderElement.value = "4";
                    window.siyuan.config.sync.provider = 4;
                } else {
                    window.siyuan.config.sync.provider = parseInt(syncProviderElement.value, 10);
                }
```

- [ ] **Step 5: Hide perception controls for official provider**

In `app/src/config/repos.ts`, ensure all `syncPerception` visibility checks continue to require `window.siyuan.config.sync.provider === 0`; since provider `0` is no longer selectable, this keeps official perception controls hidden for visible providers. Do not add a new provider `0` code path.

- [ ] **Step 6: Guard cloud directory UI calls**

In `app/src/sync/syncGuide.ts`, add provider guards to avoid official cloud directory API calls for disabled official provider and unsupported non-official providers.

At the start of `getSyncCloudList`, add:

```ts
    if (window.siyuan.config.sync.provider === 0) {
        element.innerHTML = `<div class="b3-list-item">${window.siyuan.languages._kernel?.[29] || "Official service is disabled in this fork."}</div>`;
        return;
    }
```

If TypeScript rejects optional indexed language access, use the literal string fallback as in Step 1.

- [ ] **Step 7: Run frontend build checks**

Run from `app`:

```powershell
pnpm run build:desktop
pnpm run build:mobile
```

Expected: both commands exit 0. Existing webpack asset-size warnings are acceptable.

- [ ] **Step 8: Commit frontend sync provider UI changes**

Run from repo root:

```powershell
git add -- app/src/config/repos.ts app/src/sync/syncGuide.ts
git commit -m "chore: hide official sync provider UI"
```

Expected: commit succeeds and includes only the two frontend files.

---

### Task 3: Final Verification And Residual Audit

**Files:**
- Modify: none expected unless verification reveals a narrow compile error.

- [ ] **Step 1: Run focused Go tests**

Run from `kernel`:

```powershell
go test -vet=off ./model -run "TestOfficial(SyncProvider|Account|Update|CloudAI)" -count=1
```

Expected: PASS.

- [ ] **Step 2: Run affected Go package verification**

Run from `kernel`:

```powershell
go test ./api ./model ./conf
```

Expected: PASS if the existing vet baseline has been fixed. If this fails with pre-existing `non-constant format string` vet errors, run:

```powershell
go test -vet=off ./api ./model ./conf
```

Expected with vet disabled: PASS. Record the vet blocker in the final summary.

- [ ] **Step 3: Run frontend production builds**

Run from `app`:

```powershell
pnpm run build:desktop
pnpm run build:mobile
```

Expected: both commands exit 0. Existing webpack asset-size warnings are acceptable.

- [ ] **Step 4: Verify official sync provider is not user-selectable**

Run from repo root:

```powershell
rg -n "<option value=\"0\"|ProviderSiYuan|NewSiYuan|GetCloudSyncServer|GetCloudWebSocketServer|listCloudSyncDir|createCloudSyncDir|removeCloudSyncDir|connectSyncWebSocket\\(" app/src kernel -g '!app/node_modules/**' -g '!app/stage/**' -g '!app/src/asset/pdf/**'
```

Expected:

- No `<option value="0"` in `app/src`.
- `ProviderSiYuan` remains only in compatibility constants, disabled guards, tests, or deferred comments.
- `NewSiYuan` should no longer be reachable in `newRepository`; ideally no active `cloud.NewSiYuan` call remains.
- Official cloud directory route names may remain in API/router and frontend helper names for compatibility, but model/API behavior must be disabled for provider `0`.

- [ ] **Step 5: Verify preserved providers and deferred scopes**

Run from repo root:

```powershell
rg -n "ProviderS3|ProviderWebDAV|ProviderLocal|setSyncProviderS3|setSyncProviderWebDAV|setSyncProviderLocal|getBazaarPlugin|installBazaarPlugin|class Plugin|publishService" app/src kernel -g '!app/node_modules/**' -g '!app/stage/**' -g '!app/src/asset/pdf/**'
```

Expected: matches remain for S3, WebDAV, Local, bazaar, plugin runtime, and local publish.

- [ ] **Step 6: Final worktree review**

Run from repo root:

```powershell
git status --short
git log --oneline -8
```

Expected:

- Round 2 implementation commits are present.
- Worktree has no unintended uncommitted changes.

- [ ] **Step 7: Final summary**

Report:

- Official SiYuan sync provider disabled in defaults, backend, and UI.
- S3/WebDAV/Local sync preserved.
- Verification commands that passed.
- Any normal `go test` vet baseline blocker if it remains.
