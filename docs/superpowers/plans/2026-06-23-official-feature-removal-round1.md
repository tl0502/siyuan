# Official Feature Removal Round 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Disable the first approved batch of upstream SiYuan official-service features while preserving local editing, local plugins, local publish, user-provided OpenAI/Azure AI, and sync code.

**Architecture:** Make narrow, reversible changes: hide frontend entry points, return deterministic disabled responses from official-service backend paths, and skip official background jobs. Do not delete large modules or remove dependencies in Round 1.

**Tech Stack:** TypeScript frontend under `app/src`, Electron HTML/JS under `app/electron`, Go kernel under `kernel`, existing `pnpm` scripts and `go test` for verification.

---

## Current Worktree Guard

Do not revert or overwrite these pre-existing changes:

- `.gitignore`
- `app/electron/main.js`
- `OFFICIAL_FEATURE_AUDIT.md`

When committing implementation tasks, stage only files touched by that task.

## Spec Coverage Map

- Account, membership, VIP, subscription, free trial, activation code, login, 2FA login, and deactivation entry points: Task 1 and Task 2.
- Official update checking, official announcements, and automatic installer package download: Task 1 and Task 3.
- Official website, download, community, support, and feedback links exposed in the UI: Task 3.
- Official cloud AI proxy path through `CloudChatGPT`: Task 1.
- Online bazaar implementation: explicitly deferred; Task 4 verifies bazaar references remain.
- Sync implementation, including `ProviderSiYuan`, S3, WebDAV, and Local File System providers: explicitly deferred; Task 4 verifies sync references remain.
- Local plugin runtime and local installed package handling: explicitly deferred; Task 4 verifies plugin runtime references remain.
- Local publish service and publish access control: explicitly deferred; Task 4 verifies publish references remain.

## Acceptance Criteria Coverage

Task 4 verifies every acceptance criterion from the approved design: account UI is unreachable, account backend calls are disabled, update and announcement paths do not contact official endpoints, official user-facing links are removed or inert, cloud AI is disabled, and deferred local capabilities remain present.

## File Structure

- `kernel/model/cloud_service.go`: owns official cloud account, user refresh, subscription reminder, cloud AI, and announcement scheduling. Add the shared disabled error and no-op official cloud service functions here.
- `kernel/model/updater.go`: owns official update, installer package download, and official announcement retrieval. Convert official network paths to no-op or disabled return.
- `kernel/model/official_service_disabled_test.go`: new focused tests proving official account/update/AI paths return without official network work.
- `kernel/api/account.go`: keep routes stable but let account handlers return disabled results through model functions.
- `kernel/api/setting.go`: disable 2FA cloud login handler.
- `kernel/conf/account.go`: disable account title/VIP defaults.
- `app/src/config/index.ts`: remove desktop Account settings tab and container.
- `app/src/layout/topBar.ts`: remove VIP/account toolbar item and click handling.
- `app/src/mobile/menu/index.ts`: remove mobile account and feedback entries.
- `app/src/config/about.ts`: remove update check and installer download controls.
- `app/electron/init.html`: remove official support/community/download links from first-run UI.
- `app/electron/error.html`: remove official support/download links from error UI.
- `app/electron/main.js`: remove user-facing official website menu link and official URL in user agent, without touching existing port logic.
- `app/src/config/util/about.ts`, `app/src/layout/status.ts`, `app/src/menus/workspace.ts`, `app/src/config/appearance.ts`, `app/src/constants.ts`: remove user-facing official links and official public asset fallback.

---

### Task 1: Backend Official Account, Membership, Update, Announcement, And Cloud AI Disable

**Files:**
- Create: `kernel/model/official_service_disabled_test.go`
- Modify: `kernel/model/cloud_service.go`
- Modify: `kernel/model/updater.go`
- Modify: `kernel/api/setting.go`
- Modify: `kernel/conf/account.go`

- [ ] **Step 1: Write failing model tests for disabled official services**

Create `kernel/model/official_service_disabled_test.go`:

```go
package model

import (
	"errors"
	"testing"
)

func TestOfficialAccountServicesDisabled(t *testing.T) {
	if err := StartFreeTrial(); !errors.Is(err, ErrOfficialServiceDisabled) {
		t.Fatalf("StartFreeTrial() error = %v, want ErrOfficialServiceDisabled", err)
	}
	if err := DeactivateUser(); !errors.Is(err, ErrOfficialServiceDisabled) {
		t.Fatalf("DeactivateUser() error = %v, want ErrOfficialServiceDisabled", err)
	}
	if err := UseActivationcode("abc"); !errors.Is(err, ErrOfficialServiceDisabled) {
		t.Fatalf("UseActivationcode() error = %v, want ErrOfficialServiceDisabled", err)
	}
	code, msg := CheckActivationcode("abc")
	if code != -1 || msg != ErrOfficialServiceDisabled.Error() {
		t.Fatalf("CheckActivationcode() = (%d, %q), want (-1, %q)", code, msg, ErrOfficialServiceDisabled.Error())
	}
	ret := Login("user", "pass", "captcha", 0)
	if ret == nil || ret.Code != -1 || ret.Msg != ErrOfficialServiceDisabled.Error() {
		t.Fatalf("Login() = %#v, want disabled result", ret)
	}
}

func TestOfficialUpdateAndAnnouncementServicesDisabled(t *testing.T) {
	urls, checksum, err := getUpdatePkg()
	if !errors.Is(err, ErrOfficialServiceDisabled) {
		t.Fatalf("getUpdatePkg() error = %v, want ErrOfficialServiceDisabled", err)
	}
	if len(urls) != 0 || checksum != "" {
		t.Fatalf("getUpdatePkg() = (%v, %q), want empty values", urls, checksum)
	}
	if announcements := getAnnouncements(); len(announcements) != 0 {
		t.Fatalf("getAnnouncements() length = %d, want 0", len(announcements))
	}
	checkDownloadInstallPkg()
	CheckUpdate(true)
	CheckUpdate(false)
}

func TestOfficialCloudAIDisabled(t *testing.T) {
	ret, stop, err := CloudChatGPT("hello", nil)
	if !errors.Is(err, ErrOfficialServiceDisabled) {
		t.Fatalf("CloudChatGPT() error = %v, want ErrOfficialServiceDisabled", err)
	}
	if ret != "" || !stop {
		t.Fatalf("CloudChatGPT() = (%q, %v, %v), want empty, stop=true, disabled error", ret, stop, err)
	}
}
```

- [ ] **Step 2: Run tests to verify they fail before implementation**

Run:

```powershell
Set-Location kernel
go test ./model -run "TestOfficial(Account|Update|CloudAI)" -count=1
```

Expected: FAIL because `ErrOfficialServiceDisabled` does not exist and current functions still perform old behavior.

- [ ] **Step 3: Add shared disabled error and disable official cloud functions**

In `kernel/model/cloud_service.go`, add the shared error near the existing cloud error:

```go
var ErrOfficialServiceDisabled = errors.New("Official service is disabled in this fork.")
```

Replace these function bodies with deterministic disabled behavior:

```go
func CloudChatGPT(msg string, contextMsgs []string) (ret string, stop bool, err error) {
	stop = true
	err = ErrOfficialServiceDisabled
	return
}

func StartFreeTrial() (err error) {
	return ErrOfficialServiceDisabled
}

func DeactivateUser() (err error) {
	return ErrOfficialServiceDisabled
}

func RefreshCheckJob2H() {
}

func RefreshCheckJob6H() {
}

func refreshSubscriptionExpirationRemind() {
}

func refreshUser() {
}

func refreshAnnouncement() {
}

func UseActivationcode(code string) (err error) {
	return ErrOfficialServiceDisabled
}

func CheckActivationcode(code string) (retCode int, msg string) {
	return -1, ErrOfficialServiceDisabled.Error()
}

func Login(userName, password, captcha string, cloudRegion int) (ret *gulu.Result) {
	ret = gulu.Ret.NewResult()
	ret.Code = -1
	ret.Msg = ErrOfficialServiceDisabled.Error()
	return
}
```

Leave unrelated helpers such as local publish, sync helpers, and upload helpers untouched in this task.

- [ ] **Step 4: Disable official update and announcement network paths**

In `kernel/model/updater.go`, replace these function bodies:

```go
func checkDownloadInstallPkg() {
}

func getUpdatePkg() (downloadPkgURLs []string, checksum string, err error) {
	err = ErrOfficialServiceDisabled
	return
}

func getAnnouncements() (ret []*Announcement) {
	return
}

func CheckUpdate(showMsg bool) {
	if showMsg {
		util.PushUpdateMsg("update-notify", ErrOfficialServiceDisabled.Error(), 3000)
	}
}
```

After this edit, remove imports from `kernel/model/updater.go` that are no longer used by the remaining code.

- [ ] **Step 5: Disable 2FA cloud login handler**

In `kernel/api/setting.go`, replace `login2faCloudUser` with:

```go
func login2faCloudUser(c *gin.Context) {
	ret := gulu.Ret.NewResult()
	defer c.JSON(http.StatusOK, ret)

	ret.Code = -1
	ret.Msg = model.ErrOfficialServiceDisabled.Error()
}
```

- [ ] **Step 6: Disable account display defaults**

In `kernel/conf/account.go`, change `NewAccount`:

```go
func NewAccount() *Account {
	return &Account{
		DisplayTitle: false,
		DisplayVIP:   false,
	}
}
```

- [ ] **Step 7: Format Go files**

Run:

```powershell
gofmt -w kernel/model/cloud_service.go kernel/model/updater.go kernel/model/official_service_disabled_test.go kernel/api/setting.go kernel/conf/account.go
```

Expected: command exits 0 and only formats listed files.

- [ ] **Step 8: Run focused Go tests**

Run:

```powershell
Set-Location kernel
go test ./model -run "TestOfficial(Account|Update|CloudAI)" -count=1
```

Expected: PASS.

- [ ] **Step 9: Commit backend disable work**

Run:

```powershell
git add -- kernel/model/cloud_service.go kernel/model/updater.go kernel/model/official_service_disabled_test.go kernel/api/setting.go kernel/conf/account.go
git commit -m "chore: disable official cloud account services"
```

Expected: commit succeeds and does not include `.gitignore`, `app/electron/main.js` unrelated port edits, or `OFFICIAL_FEATURE_AUDIT.md`.

---

### Task 2: Hide Account And Membership UI

**Files:**
- Modify: `app/src/config/index.ts`
- Modify: `app/src/layout/topBar.ts`
- Modify: `app/src/mobile/menu/index.ts`

- [ ] **Step 1: Remove desktop Account tab from Settings**

In `app/src/config/index.ts`:

1. Remove this import:

```ts
import {account} from "./account";
```

2. Remove the `case "account"` branch from the settings tab switch:

```ts
case "account":
    containerElement.innerHTML = account.genHTML();
    account.element = containerElement;
    account.bindEvent(account.element);
    break;
```

3. Remove the sidebar item:

```ts
<li data-name="account" class="b3-list-item"><svg class="b3-list-item__graphic"><use xlink:href="#iconAccount"></use></svg><span class="b3-list-item__text">${window.siyuan.languages.account}</span></li>
```

4. Remove the account tab container:

```ts
<div class="config__tab-container config__tab-container--full fn__none" data-name="account"></div>
```

- [ ] **Step 2: Remove VIP/account toolbar entry**

In `app/src/layout/topBar.ts`:

1. Remove this HTML from `getDockHTML`:

```ts
<div id="toolbarVIP" class="fn__flex${window.siyuan.config.readonly ? " fn__none" : ""}"></div>
```

2. Replace the hide-element menu label/icon special cases:

```ts
label: itemId === "toolbarVIP" ? window.siyuan.languages.account : hideElement.getAttribute("aria-label"),
icon: itemId === "toolbarVIP" ? "iconAccount" : (useElement ? useElement.getAttribute("xlink:href").substring(1) : undefined),
```

with:

```ts
label: hideElement.getAttribute("aria-label"),
icon: useElement ? useElement.getAttribute("xlink:href").substring(1) : undefined,
```

3. Remove the `targetId === "toolbarVIP"` click branch:

```ts
} else if (targetId === "toolbarVIP") {
    if (!window.siyuan.config.readonly) {
        const dialogSetting = openSetting(app);
        dialogSetting.element.querySelector('.b3-tab-bar [data-name="account"]').dispatchEvent(new CustomEvent("click"));
    }
```

4. If `openSetting` becomes unused, remove its import from `app/src/layout/topBar.ts`.

- [ ] **Step 3: Remove mobile account menu entry**

In `app/src/mobile/menu/index.ts`:

1. Remove this import if it becomes unused:

```ts
import {login, showAccountInfo} from "../settings/account";
```

2. Replace account HTML initialization and generation:

```ts
let accountHTML = "";
if (window.siyuan.user && !window.siyuan.config.readonly) {
    accountHTML = `<div class="b3-menu__item" id="menuAccount">
    <img class="b3-menu__icon" src="${window.siyuan.user.userAvatarURL}"/>
    <span class="b3-menu__label">${window.siyuan.user.userName}</span>
</div>`;
} else if (!window.siyuan.config.readonly) {
    accountHTML = `<div class="b3-menu__item" id="menuAccount">
    <svg class="b3-menu__icon"><use xlink:href="#iconAccount"></use></svg><span class="b3-menu__label">${window.siyuan.languages.login}</span>
</div>`;
}
```

with:

```ts
const accountHTML = "";
```

3. Remove the `target.id === "menuAccount"` click branch:

```ts
} else if (target.id === "menuAccount") {
    event.preventDefault();
    event.stopPropagation();
    if (document.querySelector("#menuAccount img")) {
        showAccountInfo();
        return;
    }
    login();
```

- [ ] **Step 4: Run frontend type/build check for account UI changes**

Run:

```powershell
Set-Location app
pnpm run build:desktop
```

Expected: webpack build exits 0. If build is too slow for local iteration, run `pnpm run gen:types` first and still run `pnpm run build:desktop` before final completion.

- [ ] **Step 5: Commit account UI work**

Run:

```powershell
git add -- app/src/config/index.ts app/src/layout/topBar.ts app/src/mobile/menu/index.ts
git commit -m "chore: hide official account UI"
```

Expected: commit succeeds and does not include unrelated worktree changes.

---

### Task 3: Hide Official Update Controls And Disable Official Links

**Files:**
- Modify: `app/src/config/about.ts`
- Modify: `app/electron/init.html`
- Modify: `app/electron/error.html`
- Modify: `app/electron/main.js`
- Modify: `app/src/config/util/about.ts`
- Modify: `app/src/layout/status.ts`
- Modify: `app/src/menus/workspace.ts`
- Modify: `app/src/mobile/menu/index.ts`
- Modify: `app/src/config/appearance.ts`
- Modify: `app/src/constants.ts`

- [ ] **Step 1: Remove About update controls**

In `app/src/config/about.ts`:

1. Replace the non-store `checkUpdateHTML` branch with an empty string:

```ts
const checkUpdateHTML = "";
```

2. Remove the `<label>` block containing `id="downloadInstallPkg"`.

3. Remove the event binding for `#checkUpdateBtn`:

```ts
const updateElement = about.element.querySelector("#checkUpdateBtn");
updateElement?.addEventListener("click", () => {
    if (updateElement.firstElementChild.classList.contains("fn__rotate")) {
        return;
    }
    updateElement.innerHTML = `<svg class="fn__rotate"><use xlink:href="#iconRefresh"></use></svg>${window.siyuan.languages.checkUpdate}`;
    fetchPost("/api/system/checkUpdate", {showMsg: true}, () => {
        updateElement.innerHTML = `<svg><use xlink:href="#iconRefresh"></use></svg>${window.siyuan.languages.checkUpdate}`;
    });
});
```

4. Remove the event binding for `#downloadInstallPkg`:

```ts
const downloadInstallPkgElement = about.element.querySelector("#downloadInstallPkg") as HTMLInputElement;
downloadInstallPkgElement.addEventListener("change", () => {
    fetchPost("/api/system/setDownloadInstallPkg", {downloadInstallPkg: downloadInstallPkgElement.checked}, () => {
        window.siyuan.config.system.downloadInstallPkg = downloadInstallPkgElement.checked;
    });
});
```

- [ ] **Step 2: Remove Electron first-run official links**

In `app/electron/init.html`, replace both `.feedback` blocks with empty containers to preserve layout:

```html
<div class="feedback"></div>
```

Do this for the Chinese block that currently contains `ld246.com` and `b3log.org`, and the English block that currently contains `liuyun.io` and `b3log.org`.

- [ ] **Step 3: Remove Electron error official links**

In `app/electron/error.html`, replace the official link grid:

```html
<div class="feedback">
    <a href="https://ld246.com/article/1649901726096" target="_blank">求助反馈建议</a>
    <a href="https://b3log.org/siyuan/download.html" target="_blank">下载最新版</a>
    <a href="https://liuyun.io/article/1686530886208" target="_blank">Feedback and support</a>
    <a href="https://b3log.org/siyuan/en/download.html" target="_blank">Download the latest version</a>
</div>
```

with:

```html
<div class="feedback"></div>
```

- [ ] **Step 4: Remove official URL from Electron user agents and menu**

In `app/electron/main.js`, change user-agent assignments from:

```js
"SiYuan/" + appVer + " https://b3log.org/siyuan Electron " + currentWindow.webContents.userAgent
```

to:

```js
"SiYuan/" + appVer + " Electron " + currentWindow.webContents.userAgent
```

Apply the same replacement to `printWin.webContents.userAgent` and other child window user-agent assignments.

Remove the official website menu item:

```js
{
    label: lang.officialWebsite, click: () => {
        shell.openExternal("https://b3log.org/siyuan/");
    }
},
```

Keep the GitHub menu item unchanged in Round 1 unless it is directly labeled as official website.

- [ ] **Step 5: Make frontend about/status/menu official links inert**

In `app/src/config/util/about.ts`, replace official URL builders with empty strings:

```ts
export const getCloudURL = (path: string) => "";
export const getIndexURL = (key: string) => "";
```

In `app/src/layout/status.ts`, remove menu items whose click handlers open:

```ts
window.open("https://ld246.com/article/1649901726096");
window.open("https://liuyun.io/article/1686530886208");
window.open("https://b3log.org/siyuan");
```

In `app/src/menus/workspace.ts`, remove the `id: "feedback"` menu item that opens `ld246.com` or `liuyun.io`.

In `app/src/mobile/menu/index.ts`, remove this feedback anchor:

```ts
<a class="b3-menu__item" href="${"zh_CN" === window.siyuan.config.lang || "zh_CHT" === window.siyuan.config.lang ? "https://ld246.com/article/1649901726096" : "https://liuyun.io/article/1686530886208"}" target="_blank">
    <svg class="b3-menu__icon"><use xlink:href="#iconFeedback"></use></svg>
    <span class="b3-menu__label">${window.siyuan.languages.feedback}</span>
</a>
```

In `app/src/config/appearance.ts`, remove the community code-snippet link:

```ts
<a class="b3-button b3-button--outline fn__flex-center fn__size200${"zh_CN" !== window.siyuan.config.lang ? " fn__none" : ""}" target="_blank" href="https://ld246.com/tag/code-snippet">
    <svg><use xlink:href="#iconUpload"></use></svg>${window.siyuan.languages.visitCommunityShare}
</a>
```

In `app/src/constants.ts`, replace:

```ts
public static readonly ASSETS_ADDRESS: string = "https://assets.b3logfile.com/siyuan/";
```

with:

```ts
public static readonly ASSETS_ADDRESS: string = "";
```

- [ ] **Step 6: Run frontend build checks**

Run:

```powershell
Set-Location app
pnpm run build:desktop
pnpm run build:mobile
```

Expected: both webpack builds exit 0.

- [ ] **Step 7: Commit update/link UI work**

Run:

```powershell
git add -- app/src/config/about.ts app/electron/init.html app/electron/error.html app/electron/main.js app/src/config/util/about.ts app/src/layout/status.ts app/src/menus/workspace.ts app/src/mobile/menu/index.ts app/src/config/appearance.ts app/src/constants.ts
git commit -m "chore: remove official update and support links"
```

Expected: commit succeeds. Inspect `git diff --cached app/electron/main.js` before committing to confirm the existing port changes were not altered or staged.

---

### Task 4: Full Verification And Residual Search Audit

**Files:**
- Modify: none expected, unless verification reveals compile errors requiring narrow fixes.

- [ ] **Step 1: Run full Go verification for touched kernel packages**

Run:

```powershell
Set-Location kernel
go test ./api ./model ./conf
```

Expected: all listed packages pass. If unrelated package failures occur, capture exact package and error before deciding whether a narrow fix is required.

- [ ] **Step 2: Run frontend production builds**

Run:

```powershell
Set-Location app
pnpm run build:desktop
pnpm run build:mobile
```

Expected: both builds exit 0.

- [ ] **Step 3: Verify removed Round 1 UI/backend entry points**

Run:

```powershell
rg -n "toolbarVIP|menuAccount|checkUpdateBtn|downloadInstallPkg|/api/account/login|startFreeTrial|useActivationcode|checkActivationcode|CloudChatGPT\\(" app/src app/electron kernel -g '!app/node_modules/**' -g '!app/stage/**' -g '!app/src/asset/pdf/**'
```

Expected:

- No `toolbarVIP`, `menuAccount`, `checkUpdateBtn`, or `downloadInstallPkg` matches in frontend UI.
- Backend route strings may remain in `kernel/api/router.go` if endpoints are intentionally stable, but handlers/model functions must be disabled.
- `CloudChatGPT(` may remain only as a disabled function definition or internal reference that does not call official cloud.

- [ ] **Step 4: Verify official user-facing links are gone from Round 1 surfaces**

Run:

```powershell
rg -n "b3log\\.org/siyuan|ld246\\.com/article/1649901726096|liuyun\\.io/article/1686530886208|assets\\.b3logfile\\.com/siyuan" app/src app/electron kernel -g '!app/node_modules/**' -g '!app/stage/**' -g '!app/src/asset/pdf/**'
```

Expected:

- No matches in user-facing Round 1 files.
- Matches in source comments or documentation are allowed only if outside touched surfaces and recorded in the final summary.

- [ ] **Step 5: Verify deferred scopes were not removed**

Run:

```powershell
rg -n "ProviderSiYuan|ProviderS3|ProviderWebDAV|ProviderLocal|getBazaarPlugin|installBazaarPlugin|class Plugin|publishService" app/src kernel -g '!app/node_modules/**' -g '!app/stage/**' -g '!app/src/asset/pdf/**'
```

Expected: matches still exist, proving sync providers, bazaar, plugin runtime, and local publish remain present for later rounds.

- [ ] **Step 6: Final worktree review**

Run:

```powershell
git status --short
git log --oneline -5
```

Expected:

- Implementation commits are present.
- Pre-existing unrelated `.gitignore`, `app/electron/main.js` port changes, and `OFFICIAL_FEATURE_AUDIT.md` are not accidentally reverted.
- Any remaining uncommitted changes are intentional and reported.

- [ ] **Step 7: Final summary**

Report:

- Which Round 1 groups were disabled.
- Which verification commands passed or failed.
- Any official-service references intentionally left because they are route compatibility, comments, docs, sync, bazaar, local publish, or plugin runtime.
