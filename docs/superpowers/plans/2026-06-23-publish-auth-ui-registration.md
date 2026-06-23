# Publish Auth UI and Registration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add local publish-site visitor login, self-registration with administrator review, and management UI based on the existing publish service.

**Architecture:** Store publish visitor accounts in `data/.siyuan/publishUsers.json` with bcrypt password hashes. Keep existing Basic Auth accounts compatible, add publish-port auth endpoints at the reverse proxy boundary, and extend the existing settings publish page for review and account management.

**Tech Stack:** Go, Gin, `golang.org/x/crypto/bcrypt`, existing SiYuan `gulu`/`filelock` utilities, TypeScript, existing `b3-*` UI classes, webpack.

**Project execution note:** `AGENTS.md` says subagent tools are unavailable. Execute this plan inline with `superpowers:executing-plans`.

**Command context:** Run Go test and `gofmt` commands from `D:\Project\siyunfork\kernel`. Run Git commands from `D:\Project\siyunfork`.

---

## File Structure

- Create `kernel/model/publish_user.go`: owns publish visitor account storage, validation, password hashing, status transitions, public DTOs, and login checks.
- Create `kernel/model/publish_user_test.go`: tests account lifecycle, password hashing, duplicate rejection, status transitions, and generic login failure.
- Modify `kernel/model/auth.go`: add session-to-token helpers so both Basic Auth and publish visitor logins can reuse the existing publish reader JWT injection path.
- Create `kernel/server/proxy/publish_auth.go`: serves publish login HTML and handles `/publish/auth/login`, `/publish/auth/register`, and `/publish/auth/logout`.
- Modify `kernel/server/proxy/publish.go`: call the new publish auth handler before reverse proxying ordinary requests and keep existing Basic Auth compatibility.
- Modify `kernel/api/setting.go`: add management handlers for publish visitor accounts.
- Modify `kernel/api/router.go`: register the management routes with `CheckAuth`, `CheckAdminRole`, and `CheckReadonly`.
- Create `kernel/api/publish_user_test.go`: tests management handlers without relying on the full application server.
- Modify `app/src/types/config.d.ts`: add frontend publish visitor account types.
- Modify `app/src/config/publish.ts`: add the management UI section and client calls for account operations.

## Task 1: Publish Visitor Account Model

**Files:**
- Create: `kernel/model/publish_user.go`
- Create: `kernel/model/publish_user_test.go`

- [ ] **Step 1: Write failing model tests**

Create `kernel/model/publish_user_test.go` with these tests:

```go
package model

import (
	"errors"
	"path/filepath"
	"testing"

	"github.com/siyuan-note/siyuan/kernel/util"
)

func withPublishUserTempDataDir(t *testing.T) {
	t.Helper()
	originalDataDir := util.DataDir
	util.DataDir = filepath.Join(t.TempDir(), "data")
	t.Cleanup(func() {
		util.DataDir = originalDataDir
	})
}

func TestPublishUserRegisterAndApproveLogin(t *testing.T) {
	withPublishUserTempDataDir(t)

	user, err := RegisterPublishUser("alice", "secret-123", "Alice")
	if err != nil {
		t.Fatalf("register failed: %s", err)
	}
	if user.Status != PublishUserStatusPending {
		t.Fatalf("status = %s, want %s", user.Status, PublishUserStatusPending)
	}
	if user.PasswordHash == "" || user.PasswordHash == "secret-123" {
		t.Fatalf("password hash was not stored safely: %q", user.PasswordHash)
	}

	if _, err = AuthenticatePublishUser("alice", "secret-123"); !errors.Is(err, ErrPublishUserAuthFailed) {
		t.Fatalf("pending user login error = %v, want ErrPublishUserAuthFailed", err)
	}

	if _, err = SetPublishUserStatus("alice", PublishUserStatusApproved); err != nil {
		t.Fatalf("approve failed: %s", err)
	}

	approved, err := AuthenticatePublishUser("alice", "secret-123")
	if err != nil {
		t.Fatalf("approved login failed: %s", err)
	}
	if approved.Username != "alice" {
		t.Fatalf("approved username = %s, want alice", approved.Username)
	}
}

func TestPublishUserRejectsDuplicateUsername(t *testing.T) {
	withPublishUserTempDataDir(t)

	if _, err := RegisterPublishUser("alice", "secret-123", "Alice"); err != nil {
		t.Fatalf("first register failed: %s", err)
	}
	if _, err := RegisterPublishUser("alice", "secret-456", "Alice 2"); !errors.Is(err, ErrPublishUserExists) {
		t.Fatalf("duplicate error = %v, want ErrPublishUserExists", err)
	}
}

func TestPublishUserValidation(t *testing.T) {
	withPublishUserTempDataDir(t)

	cases := []struct {
		name     string
		username string
		password string
		nickname string
	}{
		{name: "missing username", username: "", password: "secret-123", nickname: "Alice"},
		{name: "missing password", username: "alice", password: "", nickname: "Alice"},
		{name: "missing nickname", username: "alice", password: "secret-123", nickname: ""},
	}

	for _, testCase := range cases {
		t.Run(testCase.name, func(t *testing.T) {
			if _, err := RegisterPublishUser(testCase.username, testCase.password, testCase.nickname); !errors.Is(err, ErrPublishUserInvalid) {
				t.Fatalf("error = %v, want ErrPublishUserInvalid", err)
			}
		})
	}
}

func TestPublishUserPublicListHidesPasswordHash(t *testing.T) {
	withPublishUserTempDataDir(t)

	if _, err := RegisterPublishUser("alice", "secret-123", "Alice"); err != nil {
		t.Fatalf("register failed: %s", err)
	}

	publicUsers, err := ListPublishUsersPublic()
	if err != nil {
		t.Fatalf("list failed: %s", err)
	}
	if len(publicUsers) != 1 {
		t.Fatalf("public user count = %d, want 1", len(publicUsers))
	}
	if publicUsers[0].Username != "alice" || publicUsers[0].Nickname != "Alice" || publicUsers[0].Status != PublishUserStatusPending {
		t.Fatalf("unexpected public user: %+v", publicUsers[0])
	}
}

func TestPublishUserResetPasswordAndDelete(t *testing.T) {
	withPublishUserTempDataDir(t)

	if _, err := RegisterPublishUser("alice", "secret-123", "Alice"); err != nil {
		t.Fatalf("register failed: %s", err)
	}
	if _, err := SetPublishUserStatus("alice", PublishUserStatusApproved); err != nil {
		t.Fatalf("approve failed: %s", err)
	}
	if err := ResetPublishUserPassword("alice", "secret-456"); err != nil {
		t.Fatalf("reset password failed: %s", err)
	}
	if _, err := AuthenticatePublishUser("alice", "secret-123"); !errors.Is(err, ErrPublishUserAuthFailed) {
		t.Fatalf("old password error = %v, want ErrPublishUserAuthFailed", err)
	}
	if _, err := AuthenticatePublishUser("alice", "secret-456"); err != nil {
		t.Fatalf("new password login failed: %s", err)
	}
	if err := DeletePublishUser("alice"); err != nil {
		t.Fatalf("delete failed: %s", err)
	}
	if _, err := AuthenticatePublishUser("alice", "secret-456"); !errors.Is(err, ErrPublishUserAuthFailed) {
		t.Fatalf("deleted login error = %v, want ErrPublishUserAuthFailed", err)
	}
}
```

- [ ] **Step 2: Run model tests to verify they fail**

Run:

```powershell
go test ./model -run PublishUser -count=1
```

Expected: FAIL because `RegisterPublishUser`, status constants, and related functions are not defined.

- [ ] **Step 3: Implement publish user model**

Create `kernel/model/publish_user.go`:

```go
package model

import (
	"errors"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/88250/gulu"
	"github.com/siyuan-note/filelock"
	"github.com/siyuan-note/siyuan/kernel/util"
	"golang.org/x/crypto/bcrypt"
)

type PublishUserStatus string

const (
	PublishUserStatusPending  PublishUserStatus = "pending"
	PublishUserStatusApproved PublishUserStatus = "approved"
	PublishUserStatusRejected PublishUserStatus = "rejected"
	PublishUserStatusDisabled PublishUserStatus = "disabled"
)

var (
	ErrPublishUserInvalid    = errors.New("invalid publish user")
	ErrPublishUserExists     = errors.New("publish user already exists")
	ErrPublishUserNotFound   = errors.New("publish user not found")
	ErrPublishUserAuthFailed = errors.New("账号或密码错误，或账号不可用")

	publishUsersLock sync.Mutex
)

type PublishUser struct {
	Username     string            `json:"username"`
	PasswordHash string            `json:"passwordHash"`
	Nickname     string            `json:"nickname"`
	Status       PublishUserStatus `json:"status"`
	Created      int64             `json:"created"`
	Updated      int64             `json:"updated"`
}

type PublishUserPublic struct {
	Username string            `json:"username"`
	Nickname string            `json:"nickname"`
	Status   PublishUserStatus `json:"status"`
	Created  int64             `json:"created"`
	Updated  int64             `json:"updated"`
}

func publishUsersPath() string {
	return filepath.Join(util.DataDir, ".siyuan", "publishUsers.json")
}

func LoadPublishUsers() ([]*PublishUser, error) {
	publishUsersLock.Lock()
	defer publishUsersLock.Unlock()
	return loadPublishUsersUnlocked()
}

func ListPublishUsersPublic() ([]*PublishUserPublic, error) {
	users, err := LoadPublishUsers()
	if err != nil {
		return nil, err
	}
	ret := make([]*PublishUserPublic, 0, len(users))
	for _, user := range users {
		ret = append(ret, toPublishUserPublic(user))
	}
	return ret, nil
}

func RegisterPublishUser(username, password, nickname string) (*PublishUser, error) {
	username = normalizePublishUsername(username)
	nickname = strings.TrimSpace(nickname)
	if username == "" || password == "" || nickname == "" {
		return nil, ErrPublishUserInvalid
	}

	publishUsersLock.Lock()
	defer publishUsersLock.Unlock()

	users, err := loadPublishUsersUnlocked()
	if err != nil {
		return nil, err
	}
	if findPublishUser(users, username) != nil {
		return nil, ErrPublishUserExists
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}
	now := time.Now().UnixMilli()
	user := &PublishUser{
		Username:     username,
		PasswordHash: string(hash),
		Nickname:     nickname,
		Status:       PublishUserStatusPending,
		Created:      now,
		Updated:      now,
	}
	users = append(users, user)
	return user, savePublishUsersUnlocked(users)
}

func AuthenticatePublishUser(username, password string) (*PublishUser, error) {
	username = normalizePublishUsername(username)
	if username == "" || password == "" {
		return nil, ErrPublishUserAuthFailed
	}

	users, err := LoadPublishUsers()
	if err != nil {
		return nil, err
	}
	user := findPublishUser(users, username)
	if user == nil || user.Status != PublishUserStatusApproved {
		return nil, ErrPublishUserAuthFailed
	}
	if bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)) != nil {
		return nil, ErrPublishUserAuthFailed
	}
	return user, nil
}

func SetPublishUserStatus(username string, status PublishUserStatus) (*PublishUser, error) {
	username = normalizePublishUsername(username)
	if username == "" || !isValidPublishUserStatus(status) {
		return nil, ErrPublishUserInvalid
	}

	publishUsersLock.Lock()
	defer publishUsersLock.Unlock()

	users, err := loadPublishUsersUnlocked()
	if err != nil {
		return nil, err
	}
	user := findPublishUser(users, username)
	if user == nil {
		return nil, ErrPublishUserNotFound
	}
	user.Status = status
	user.Updated = time.Now().UnixMilli()
	return user, savePublishUsersUnlocked(users)
}

func ResetPublishUserPassword(username, password string) error {
	username = normalizePublishUsername(username)
	if username == "" || password == "" {
		return ErrPublishUserInvalid
	}

	publishUsersLock.Lock()
	defer publishUsersLock.Unlock()

	users, err := loadPublishUsersUnlocked()
	if err != nil {
		return err
	}
	user := findPublishUser(users, username)
	if user == nil {
		return ErrPublishUserNotFound
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	user.PasswordHash = string(hash)
	user.Updated = time.Now().UnixMilli()
	return savePublishUsersUnlocked(users)
}

func DeletePublishUser(username string) error {
	username = normalizePublishUsername(username)
	if username == "" {
		return ErrPublishUserInvalid
	}

	publishUsersLock.Lock()
	defer publishUsersLock.Unlock()

	users, err := loadPublishUsersUnlocked()
	if err != nil {
		return err
	}
	for i, user := range users {
		if user.Username == username {
			users = append(users[:i], users[i+1:]...)
			return savePublishUsersUnlocked(users)
		}
	}
	return ErrPublishUserNotFound
}

func loadPublishUsersUnlocked() ([]*PublishUser, error) {
	path := publishUsersPath()
	if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
		return nil, err
	}
	if !filelock.IsExist(path) {
		if err := filelock.WriteFile(path, []byte("[]")); err != nil {
			return nil, err
		}
	}
	data, err := filelock.ReadFile(path)
	if err != nil {
		return nil, err
	}
	users := []*PublishUser{}
	if err = gulu.JSON.UnmarshalJSON(data, &users); err != nil {
		return nil, err
	}
	return users, nil
}

func savePublishUsersUnlocked(users []*PublishUser) error {
	data, err := gulu.JSON.MarshalIndentJSON(users, "", "  ")
	if err != nil {
		return err
	}
	path := publishUsersPath()
	if err = os.MkdirAll(filepath.Dir(path), 0755); err != nil {
		return err
	}
	return filelock.WriteFile(path, data)
}

func findPublishUser(users []*PublishUser, username string) *PublishUser {
	for _, user := range users {
		if user.Username == username {
			return user
		}
	}
	return nil
}

func toPublishUserPublic(user *PublishUser) *PublishUserPublic {
	return &PublishUserPublic{
		Username: user.Username,
		Nickname: user.Nickname,
		Status:   user.Status,
		Created:  user.Created,
		Updated:  user.Updated,
	}
}

func normalizePublishUsername(username string) string {
	return strings.TrimSpace(username)
}

func isValidPublishUserStatus(status PublishUserStatus) bool {
	switch status {
	case PublishUserStatusPending, PublishUserStatusApproved, PublishUserStatusRejected, PublishUserStatusDisabled:
		return true
	default:
		return false
	}
}
```

- [ ] **Step 4: Run model tests**

Run:

```powershell
go test ./model -run PublishUser -count=1
```

Expected: PASS.

- [ ] **Step 5: Format and commit model work**

Run:

```powershell
gofmt -w model/publish_user.go model/publish_user_test.go
git status --short
git add -- model/publish_user.go model/publish_user_test.go
git commit -m "feat: add publish visitor account model"
```

Expected: commit includes only the two files from this task.

## Task 2: Publish Sessions and Visitor Auth Endpoints

**Files:**
- Modify: `kernel/model/auth.go`
- Create: `kernel/server/proxy/publish_auth.go`
- Modify: `kernel/server/proxy/publish.go`
- Test: `kernel/server/proxy/publish_auth_test.go`

- [ ] **Step 1: Write failing proxy/auth tests**

Create `kernel/server/proxy/publish_auth_test.go`:

```go
package proxy

import (
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"strings"
	"testing"

	"github.com/siyuan-note/siyuan/kernel/model"
	"github.com/siyuan-note/siyuan/kernel/util"
)

func withPublishAuthTempDataDir(t *testing.T) {
	t.Helper()
	originalDataDir := util.DataDir
	util.DataDir = filepath.Join(t.TempDir(), "data")
	t.Cleanup(func() {
		util.DataDir = originalDataDir
	})
}

func TestHandlePublishRegisterCreatesPendingUser(t *testing.T) {
	withPublishAuthTempDataDir(t)

	request := httptest.NewRequest(http.MethodPost, "/publish/auth/register", strings.NewReader(`{"username":"alice","password":"secret-123","nickname":"Alice"}`))
	response := httptest.NewRecorder()

	if !handlePublishAuth(response, request) {
		t.Fatal("handlePublishAuth returned false")
	}
	if response.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200, body %s", response.Code, response.Body.String())
	}

	users, err := model.ListPublishUsersPublic()
	if err != nil {
		t.Fatalf("list users failed: %s", err)
	}
	if len(users) != 1 || users[0].Username != "alice" || users[0].Status != model.PublishUserStatusPending {
		t.Fatalf("unexpected users: %+v", users)
	}
}

func TestHandlePublishLoginUsesGenericFailureForPendingUser(t *testing.T) {
	withPublishAuthTempDataDir(t)

	if _, err := model.RegisterPublishUser("alice", "secret-123", "Alice"); err != nil {
		t.Fatalf("register failed: %s", err)
	}

	request := httptest.NewRequest(http.MethodPost, "/publish/auth/login", strings.NewReader(`{"username":"alice","password":"secret-123"}`))
	response := httptest.NewRecorder()

	if !handlePublishAuth(response, request) {
		t.Fatal("handlePublishAuth returned false")
	}
	if response.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want 401", response.Code)
	}
	if !strings.Contains(response.Body.String(), "账号或密码错误，或账号不可用") {
		t.Fatalf("body did not include generic auth error: %s", response.Body.String())
	}
}

func TestHandlePublishLoginCreatesSessionForApprovedUser(t *testing.T) {
	withPublishAuthTempDataDir(t)
	model.InitAccounts()

	if _, err := model.RegisterPublishUser("alice", "secret-123", "Alice"); err != nil {
		t.Fatalf("register failed: %s", err)
	}
	if _, err := model.SetPublishUserStatus("alice", model.PublishUserStatusApproved); err != nil {
		t.Fatalf("approve failed: %s", err)
	}

	request := httptest.NewRequest(http.MethodPost, "/publish/auth/login", strings.NewReader(`{"username":"alice","password":"secret-123"}`))
	response := httptest.NewRecorder()

	if !handlePublishAuth(response, request) {
		t.Fatal("handlePublishAuth returned false")
	}
	if response.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200, body %s", response.Code, response.Body.String())
	}
	cookies := response.Result().Cookies()
	if len(cookies) != 1 || cookies[0].Name != model.SessionIdCookieName {
		t.Fatalf("unexpected cookies: %+v", cookies)
	}
	if token := model.GetPublishSessionToken(cookies[0].Value); token == "" {
		t.Fatal("session token was empty")
	}
}
```

- [ ] **Step 2: Run proxy tests to verify they fail**

Run:

```powershell
go test ./server/proxy -run Publish -count=1
```

Expected: FAIL because `handlePublishAuth` and `GetPublishSessionToken` are not defined.

- [ ] **Step 3: Add token-based publish sessions**

Modify `kernel/model/auth.go`:

1. Change `SessionsMap` from `map[string]string` to `map[string]*PublishSession`.
2. Add:

```go
type PublishSession struct {
	Username string
	Token    string
}
```

3. Replace the session helpers with:

```go
func GetBasicAuthUsernameBySessionID(sessionID string) string {
	if session := sessionsMap[sessionID]; session != nil {
		return session.Username
	}
	return ""
}

func GetPublishSessionToken(sessionID string) string {
	if session := sessionsMap[sessionID]; session != nil {
		return session.Token
	}
	return ""
}

func AddSession(sessionID, username string) {
	sessionLock.Lock()
	defer sessionLock.Unlock()
	token := ""
	if account := GetBasicAuthAccount(username); account != nil {
		token = account.Token
	}
	sessionsMap[sessionID] = &PublishSession{Username: username, Token: token}
}

func AddPublishVisitorSession(sessionID, username, token string) {
	sessionLock.Lock()
	defer sessionLock.Unlock()
	sessionsMap[sessionID] = &PublishSession{Username: username, Token: token}
}
```

Keep `DeleteSession` as a delete against `sessionsMap`.

- [ ] **Step 4: Add shared reader token helper**

Still in `kernel/model/auth.go`, add:

```go
func NewPublishReaderToken(username string) (string, error) {
	t := jwt.NewWithClaims(
		jwt.SigningMethodHS256,
		jwt.MapClaims{
			"iss": iss,
			"sub": sub,
			"aud": aud,
			"jti": username,

			ClaimsKeyRole: RoleReader,
		},
	)
	return t.SignedString(jwtKey)
}
```

Then simplify `InitJWT` so each account calls `NewPublishReaderToken(username)`.

- [ ] **Step 5: Create publish auth handler**

Create `kernel/server/proxy/publish_auth.go`:

```go
package proxy

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/88250/gulu"
	"github.com/siyuan-note/siyuan/kernel/model"
	"github.com/siyuan-note/siyuan/kernel/util"
)

type publishAuthRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
	Nickname string `json:"nickname"`
}

func handlePublishAuth(w http.ResponseWriter, r *http.Request) bool {
	switch r.URL.Path {
	case "/publish/auth/login":
		handlePublishLogin(w, r)
		return true
	case "/publish/auth/register":
		handlePublishRegister(w, r)
		return true
	case "/publish/auth/logout":
		handlePublishLogout(w, r)
		return true
	case "/publish/auth":
		servePublishLoginPage(w)
		return true
	default:
		return false
	}
}

func handlePublishLogin(w http.ResponseWriter, r *http.Request) {
	input, ok := decodePublishAuthRequest(w, r)
	if !ok {
		return
	}
	user, err := model.AuthenticatePublishUser(input.Username, input.Password)
	if err != nil {
		writePublishAuthJSON(w, http.StatusUnauthorized, -1, model.ErrPublishUserAuthFailed.Error(), nil)
		return
	}
	token, err := model.NewPublishReaderToken(user.Username)
	if err != nil {
		writePublishAuthJSON(w, http.StatusInternalServerError, -1, err.Error(), nil)
		return
	}
	sessionID := model.GetNewSessionID()
	model.AddPublishVisitorSession(sessionID, user.Username, token)
	http.SetCookie(w, &http.Cookie{
		Name:     model.SessionIdCookieName,
		Value:    sessionID,
		Path:     "/",
		HttpOnly: true,
		Secure:   util.SSL,
	})
	writePublishAuthJSON(w, http.StatusOK, 0, "", map[string]any{"username": user.Username})
}

func handlePublishRegister(w http.ResponseWriter, r *http.Request) {
	input, ok := decodePublishAuthRequest(w, r)
	if !ok {
		return
	}
	if _, err := model.RegisterPublishUser(input.Username, input.Password, input.Nickname); err != nil {
		writePublishAuthJSON(w, http.StatusBadRequest, -1, err.Error(), nil)
		return
	}
	writePublishAuthJSON(w, http.StatusOK, 0, "申请已提交，请等待审核", nil)
}

func handlePublishLogout(w http.ResponseWriter, r *http.Request) {
	if cookie, err := r.Cookie(model.SessionIdCookieName); err == nil {
		model.DeleteSession(cookie.Value)
	}
	http.SetCookie(w, &http.Cookie{
		Name:     model.SessionIdCookieName,
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   util.SSL,
	})
	writePublishAuthJSON(w, http.StatusOK, 0, "", nil)
}

func decodePublishAuthRequest(w http.ResponseWriter, r *http.Request) (*publishAuthRequest, bool) {
	if r.Method != http.MethodPost {
		writePublishAuthJSON(w, http.StatusMethodNotAllowed, -1, http.StatusText(http.StatusMethodNotAllowed), nil)
		return nil, false
	}
	input := &publishAuthRequest{}
	if err := json.NewDecoder(r.Body).Decode(input); err != nil {
		writePublishAuthJSON(w, http.StatusBadRequest, -1, err.Error(), nil)
		return nil, false
	}
	input.Username = strings.TrimSpace(input.Username)
	input.Nickname = strings.TrimSpace(input.Nickname)
	return input, true
}

func writePublishAuthJSON(w http.ResponseWriter, statusCode int, code int, msg string, data any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(statusCode)
	ret := gulu.Ret.NewResult()
	ret.Code = code
	ret.Msg = msg
	ret.Data = data
	_ = json.NewEncoder(w).Encode(ret)
}

func servePublishLoginPage(w http.ResponseWriter) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte(publishLoginHTML))
}

const publishLoginHTML = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Publish Login</title>
</head>
<body>
<main>
<section>
<h1>Protected Publish Site</h1>
<p>请登录或提交访问申请。</p>
</section>
<section>
<button id="loginTab" type="button">登录</button>
<button id="registerTab" type="button">注册</button>
<form id="loginForm">
<input name="username" placeholder="用户名" required>
<input name="password" placeholder="密码" type="password" required>
<button type="submit">登录</button>
</form>
<form id="registerForm" hidden>
<input name="username" placeholder="用户名" required>
<input name="password" placeholder="密码" type="password" required>
<input name="confirmPassword" placeholder="确认密码" type="password" required>
<input name="nickname" placeholder="昵称 / 备注" required>
<button type="submit">提交申请</button>
</form>
<p id="message"></p>
</section>
</main>
<script>
const message = document.getElementById("message");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
document.getElementById("loginTab").onclick = () => { loginForm.hidden = false; registerForm.hidden = true; message.textContent = ""; };
document.getElementById("registerTab").onclick = () => { loginForm.hidden = true; registerForm.hidden = false; message.textContent = ""; };
async function postJSON(url, data) {
  const response = await fetch(url, { method: "POST", body: JSON.stringify(data) });
  return response.json();
}
loginForm.onsubmit = async (event) => {
  event.preventDefault();
  const form = new FormData(loginForm);
  const result = await postJSON("/publish/auth/login", { username: form.get("username"), password: form.get("password") });
  if (result.code === 0) location.href = "/";
  else message.textContent = result.msg || "账号或密码错误，或账号不可用";
};
registerForm.onsubmit = async (event) => {
  event.preventDefault();
  const form = new FormData(registerForm);
  if (form.get("password") !== form.get("confirmPassword")) { message.textContent = "两次输入的密码不一致"; return; }
  const result = await postJSON("/publish/auth/register", { username: form.get("username"), password: form.get("password"), nickname: form.get("nickname") });
  message.textContent = result.msg || (result.code === 0 ? "申请已提交，请等待审核" : "提交失败");
};
</script>
</body>
</html>`
```

- [ ] **Step 6: Wire publish auth into reverse proxy**

Modify `kernel/server/proxy/publish.go`:

1. In `startPublishReverseProxyService`, replace the `Handler` with:

```go
Handler: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
	if handlePublishAuth(w, r) {
		return
	}
	(&httputil.ReverseProxy{
		Rewrite:   rewrite,
		Transport: transport,
	}).ServeHTTP(w, r)
}),
```

2. In `RoundTrip`, before Basic Auth, replace the existing session block with token lookup:

```go
if sessionIdCookie, cookieErr := request.Cookie(model.SessionIdCookieName); cookieErr == nil {
	if token := model.GetPublishSessionToken(sessionIdCookie.Value); token != "" {
		request.Header.Set(model.XAuthTokenKey, token)
		response, err = http.DefaultTransport.RoundTrip(request)
		return
	}
	model.DeleteSession(sessionIdCookie.Value)
}
```

3. Replace the unauthorized Basic Auth response for browser navigation with a redirect to `/publish/auth` only when there is no Basic Auth header:

```go
if !ok {
	return &http.Response{
		StatusCode: http.StatusFound,
		Status:     http.StatusText(http.StatusFound),
		Proto:      request.Proto,
		ProtoMajor: request.ProtoMajor,
		ProtoMinor: request.ProtoMinor,
		Request:    request,
		Header: http.Header{
			"Location": {"/publish/auth"},
		},
		Body:          http.NoBody,
		Close:         false,
		ContentLength: -1,
	}, nil
}
```

Keep the existing `WWW-Authenticate` response when Basic Auth is present but invalid.

- [ ] **Step 7: Run proxy tests**

Run:

```powershell
go test ./server/proxy -run Publish -count=1
go test ./model -run PublishUser -count=1
```

Expected: PASS.

- [ ] **Step 8: Format and commit auth endpoint work**

Run:

```powershell
gofmt -w model/auth.go server/proxy/publish.go server/proxy/publish_auth.go server/proxy/publish_auth_test.go
git status --short
git add -- model/auth.go server/proxy/publish.go server/proxy/publish_auth.go server/proxy/publish_auth_test.go
git commit -m "feat: add publish visitor auth endpoints"
```

Expected: commit includes only files from this task.

## Task 3: Management API

**Files:**
- Modify: `kernel/api/setting.go`
- Modify: `kernel/api/router.go`
- Create: `kernel/api/publish_user_test.go`

- [ ] **Step 1: Write failing management handler tests**

Create `kernel/api/publish_user_test.go`:

```go
package api

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/siyuan-note/siyuan/kernel/model"
	"github.com/siyuan-note/siyuan/kernel/util"
)

func withPublishUserAPITempDataDir(t *testing.T) {
	t.Helper()
	gin.SetMode(gin.TestMode)
	originalDataDir := util.DataDir
	util.DataDir = filepath.Join(t.TempDir(), "data")
	t.Cleanup(func() {
		util.DataDir = originalDataDir
	})
}

func performPublishUserHandler(handler gin.HandlerFunc, body string) *httptest.ResponseRecorder {
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodPost, "/", strings.NewReader(body))
	handler(c)
	return w
}

func TestApprovePublishUserHandler(t *testing.T) {
	withPublishUserAPITempDataDir(t)
	if _, err := model.RegisterPublishUser("alice", "secret-123", "Alice"); err != nil {
		t.Fatalf("register failed: %s", err)
	}

	w := performPublishUserHandler(approvePublishUser, `{"username":"alice"}`)
	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", w.Code)
	}

	var response struct {
		Code int `json:"code"`
		Data struct {
			User model.PublishUserPublic `json:"user"`
		} `json:"data"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
		t.Fatalf("unmarshal response failed: %s", err)
	}
	if response.Code != 0 || response.Data.User.Status != model.PublishUserStatusApproved {
		t.Fatalf("unexpected response: %s", w.Body.String())
	}
}

func TestGetPublishUsersHidesPasswordHash(t *testing.T) {
	withPublishUserAPITempDataDir(t)
	if _, err := model.RegisterPublishUser("alice", "secret-123", "Alice"); err != nil {
		t.Fatalf("register failed: %s", err)
	}

	w := performPublishUserHandler(getPublishUsers, `{}`)
	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", w.Code)
	}
	if strings.Contains(w.Body.String(), "passwordHash") || strings.Contains(w.Body.String(), "secret-123") {
		t.Fatalf("response leaked password data: %s", w.Body.String())
	}
}
```

- [ ] **Step 2: Run API tests to verify they fail**

Run:

```powershell
go test ./api -run PublishUser -count=1
```

Expected: FAIL because handlers are not defined.

- [ ] **Step 3: Add management handlers**

Modify `kernel/api/setting.go` by adding these functions near `setPublish` and `getPublish`:

```go
func getPublishUsers(c *gin.Context) {
	ret := gulu.Ret.NewResult()
	defer c.JSON(http.StatusOK, ret)

	users, err := model.ListPublishUsersPublic()
	if err != nil {
		ret.Code = -1
		ret.Msg = err.Error()
		return
	}
	ret.Data = map[string]any{"users": users}
}

func approvePublishUser(c *gin.Context) {
	setPublishUserStatus(c, model.PublishUserStatusApproved)
}

func rejectPublishUser(c *gin.Context) {
	setPublishUserStatus(c, model.PublishUserStatusRejected)
}

func disablePublishUser(c *gin.Context) {
	setPublishUserStatus(c, model.PublishUserStatusDisabled)
}

func setPublishUserStatus(c *gin.Context, status model.PublishUserStatus) {
	ret := gulu.Ret.NewResult()
	defer c.JSON(http.StatusOK, ret)

	username, ok := publishUsernameArg(c, ret)
	if !ok {
		return
	}
	user, err := model.SetPublishUserStatus(username, status)
	if err != nil {
		ret.Code = -1
		ret.Msg = err.Error()
		return
	}
	ret.Data = map[string]any{"user": model.PublishUserPublic{
		Username: user.Username,
		Nickname: user.Nickname,
		Status:   user.Status,
		Created:  user.Created,
		Updated:  user.Updated,
	}}
}

func deletePublishUser(c *gin.Context) {
	ret := gulu.Ret.NewResult()
	defer c.JSON(http.StatusOK, ret)

	username, ok := publishUsernameArg(c, ret)
	if !ok {
		return
	}
	if err := model.DeletePublishUser(username); err != nil {
		ret.Code = -1
		ret.Msg = err.Error()
	}
}

func resetPublishUserPassword(c *gin.Context) {
	ret := gulu.Ret.NewResult()
	defer c.JSON(http.StatusOK, ret)

	arg, ok := util.JsonArg(c, ret)
	if !ok {
		return
	}
	username, _ := arg["username"].(string)
	password, _ := arg["password"].(string)
	if err := model.ResetPublishUserPassword(username, password); err != nil {
		ret.Code = -1
		ret.Msg = err.Error()
	}
}

func publishUsernameArg(c *gin.Context, ret *gulu.Result) (string, bool) {
	arg, ok := util.JsonArg(c, ret)
	if !ok {
		return "", false
	}
	username, _ := arg["username"].(string)
	if strings.TrimSpace(username) == "" {
		ret.Code = -1
		ret.Msg = model.ErrPublishUserInvalid.Error()
		return "", false
	}
	return username, true
}
```

`setting.go` already imports `strings`, `gulu`, `gin`, `model`, and `util`, so no new import is expected.

- [ ] **Step 4: Register management routes**

Modify `kernel/api/router.go` near existing publish setting routes:

```go
ginServer.Handle("POST", "/api/setting/getPublishUsers", model.CheckAuth, model.CheckAdminRole, model.CheckReadonly, getPublishUsers)
ginServer.Handle("POST", "/api/setting/approvePublishUser", model.CheckAuth, model.CheckAdminRole, model.CheckReadonly, approvePublishUser)
ginServer.Handle("POST", "/api/setting/rejectPublishUser", model.CheckAuth, model.CheckAdminRole, model.CheckReadonly, rejectPublishUser)
ginServer.Handle("POST", "/api/setting/disablePublishUser", model.CheckAuth, model.CheckAdminRole, model.CheckReadonly, disablePublishUser)
ginServer.Handle("POST", "/api/setting/deletePublishUser", model.CheckAuth, model.CheckAdminRole, model.CheckReadonly, deletePublishUser)
ginServer.Handle("POST", "/api/setting/resetPublishUserPassword", model.CheckAuth, model.CheckAdminRole, model.CheckReadonly, resetPublishUserPassword)
```

- [ ] **Step 5: Run API tests**

Run:

```powershell
go test ./api -run PublishUser -count=1
go test ./model -run PublishUser -count=1
```

Expected: PASS.

- [ ] **Step 6: Format and commit management API**

Run:

```powershell
gofmt -w api/setting.go api/router.go api/publish_user_test.go
git status --short
git add -- api/setting.go api/router.go api/publish_user_test.go
git commit -m "feat: add publish visitor account management API"
```

Expected: commit includes only files from this task.

## Task 4: Publish Settings Management UI

**Files:**
- Modify: `app/src/types/config.d.ts`
- Modify: `app/src/config/publish.ts`

- [ ] **Step 1: Add frontend publish user types**

Modify `app/src/types/config.d.ts` after `IPublishAuthAccount`:

```ts
export type TPublishUserStatus = "pending" | "approved" | "rejected" | "disabled";

export interface IPublishUser {
    username: string;
    nickname: string;
    status: TPublishUserStatus;
    created: number;
    updated: number;
}
```

- [ ] **Step 2: Extend publish settings HTML**

Modify `app/src/config/publish.ts` to append this block at the end of `genHTML()` before the final template closes:

```ts
<div class="b3-label">
    <div class="fn__flex">
        <div class="fn__flex-1">
            发布访问账号
            <div class="b3-label__text">审核注册申请，并管理可登录发布站点的访问账号。</div>
        </div>
    </div>
    <div class="fn__hr"></div>
    <div id="publishUsers"></div>
</div>
```

- [ ] **Step 3: Load publish users when binding events**

In `bindEvent`, after `publish._refreshPublish();`, add:

```ts
publish._refreshPublishUsers();
```

Add methods to the `publish` object:

```ts
_refreshPublishUsers: () => {
    fetchPost("/api/setting/getPublishUsers", {}, (response) => {
        if (response.code === 0) {
            publish._renderPublishUsers(response.data.users || []);
        }
    });
},
_publishUserAction: (url: string, data: IObject = {}) => {
    fetchPost(url, data, (response) => {
        if (response.code === 0) {
            publish._refreshPublishUsers();
        }
    });
},
```

- [ ] **Step 4: Render publish user rows**

Add this method to the `publish` object:

```ts
_renderPublishUsers: (users: Config.IPublishUser[]) => {
    const publishUsers = publish.element.querySelector<HTMLDivElement>("#publishUsers");
    if (users.length === 0) {
        publishUsers.innerHTML = `<div class="b3-label__text">暂无发布访问账号。</div>`;
        return;
    }
    publishUsers.innerHTML = `<div class="fn__flex-column">${
        users.map((user) => {
            const actions: string[] = [];
            if (user.status === "pending") {
                actions.push(`<button class="b3-button b3-button--outline" data-action="approve" data-username="${user.username}">批准</button>`);
                actions.push(`<button class="b3-button b3-button--outline" data-action="reject" data-username="${user.username}">拒绝</button>`);
                actions.push(`<button class="b3-button b3-button--outline" data-action="delete" data-username="${user.username}">删除</button>`);
            } else if (user.status === "approved") {
                actions.push(`<button class="b3-button b3-button--outline" data-action="resetPassword" data-username="${user.username}">重置密码</button>`);
                actions.push(`<button class="b3-button b3-button--outline" data-action="disable" data-username="${user.username}">禁用</button>`);
                actions.push(`<button class="b3-button b3-button--outline" data-action="delete" data-username="${user.username}">删除</button>`);
            } else if (user.status === "rejected") {
                actions.push(`<button class="b3-button b3-button--outline" data-action="approve" data-username="${user.username}">批准</button>`);
                actions.push(`<button class="b3-button b3-button--outline" data-action="delete" data-username="${user.username}">删除</button>`);
            } else {
                actions.push(`<button class="b3-button b3-button--outline" data-action="approve" data-username="${user.username}">启用</button>`);
                actions.push(`<button class="b3-button b3-button--outline" data-action="delete" data-username="${user.username}">删除</button>`);
            }
            return `<div class="b3-label b3-label--inner fn__flex" data-username="${user.username}">
    <div class="fn__flex-1">
        <div>${user.username}</div>
        <div class="b3-label__text">${user.nickname} · ${user.status}</div>
    </div>
    <span class="fn__space"></span>
    <div class="fn__flex">${actions.join('<span class="fn__space"></span>')}</div>
</div>`;
        }).join("")
    }</div>`;

    publishUsers.querySelectorAll<HTMLButtonElement>("button[data-action]").forEach((button) => {
        button.addEventListener("click", () => {
            const username = button.dataset.username;
            const action = button.dataset.action;
            if (action === "approve") {
                publish._publishUserAction("/api/setting/approvePublishUser", {username});
            } else if (action === "reject") {
                publish._publishUserAction("/api/setting/rejectPublishUser", {username});
            } else if (action === "disable") {
                publish._publishUserAction("/api/setting/disablePublishUser", {username});
            } else if (action === "delete") {
                publish._publishUserAction("/api/setting/deletePublishUser", {username});
            } else if (action === "resetPassword") {
                const password = window.prompt("请输入新密码");
                if (password) {
                    publish._publishUserAction("/api/setting/resetPublishUserPassword", {username, password});
                }
            }
        });
    });
},
```

- [ ] **Step 5: Run frontend build check**

Run:

```powershell
pnpm --dir app run dev
```

Expected: webpack development build completes without TypeScript or syntax errors. Stop the command after it exits; if it watches instead of exiting, wait until the first successful compile line appears and then stop it.

- [ ] **Step 6: Commit management UI**

Run:

```powershell
git status --short
git add -- app/src/types/config.d.ts app/src/config/publish.ts
git commit -m "feat: add publish visitor management UI"
```

Expected: commit includes only files from this task.

## Task 5: Visitor Login Page Polish

**Files:**
- Modify: `kernel/server/proxy/publish_auth.go`

- [ ] **Step 1: Replace minimal HTML with document-first UI**

In `kernel/server/proxy/publish_auth.go`, replace `publishLoginHTML` with this version:

```go
const publishLoginHTML = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Publish Login</title>
<style>
:root { color-scheme: light dark; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
body { margin: 0; min-height: 100vh; background: Canvas; color: CanvasText; }
main { min-height: 100vh; display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(320px, 440px); }
.context { padding: clamp(32px, 7vw, 88px); display: flex; flex-direction: column; justify-content: center; border-right: 1px solid color-mix(in srgb, CanvasText 16%, transparent); }
.context h1 { margin: 0 0 16px; font-size: clamp(32px, 5vw, 56px); line-height: 1.05; letter-spacing: 0; }
.context p { max-width: 620px; margin: 0; color: color-mix(in srgb, CanvasText 72%, transparent); line-height: 1.7; }
.panel-wrap { display: flex; align-items: center; justify-content: center; padding: 24px; }
.panel { width: min(100%, 360px); }
.tabs { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 18px; }
button { height: 36px; border: 1px solid color-mix(in srgb, CanvasText 24%, transparent); background: Canvas; color: CanvasText; border-radius: 6px; cursor: pointer; }
button.active, form button { background: CanvasText; color: Canvas; }
form { display: flex; flex-direction: column; gap: 12px; }
input { height: 36px; box-sizing: border-box; border: 1px solid color-mix(in srgb, CanvasText 24%, transparent); border-radius: 6px; background: Canvas; color: CanvasText; padding: 0 10px; font: inherit; }
#message { min-height: 22px; color: color-mix(in srgb, CanvasText 76%, transparent); line-height: 1.5; }
@media (max-width: 760px) {
  main { grid-template-columns: 1fr; }
  .context { border-right: 0; border-bottom: 1px solid color-mix(in srgb, CanvasText 16%, transparent); padding: 32px 24px; }
  .context h1 { font-size: 32px; }
}
</style>
</head>
<body>
<main>
<section class="context">
<h1>Protected Publish Site</h1>
<p>这里是受保护的发布内容。已有账号可直接登录；新访问者可以提交申请，管理员审核后即可访问。</p>
</section>
<section class="panel-wrap">
<div class="panel">
<div class="tabs">
<button id="loginTab" class="active" type="button">登录</button>
<button id="registerTab" type="button">注册</button>
</div>
<form id="loginForm">
<input name="username" placeholder="用户名" autocomplete="username" required>
<input name="password" placeholder="密码" type="password" autocomplete="current-password" required>
<button type="submit">登录</button>
</form>
<form id="registerForm" hidden>
<input name="username" placeholder="用户名" autocomplete="username" required>
<input name="password" placeholder="密码" type="password" autocomplete="new-password" required>
<input name="confirmPassword" placeholder="确认密码" type="password" autocomplete="new-password" required>
<input name="nickname" placeholder="昵称 / 备注" required>
<button type="submit">提交申请</button>
</form>
<p id="message"></p>
</div>
</section>
</main>
<script>
const message = document.getElementById("message");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const loginTab = document.getElementById("loginTab");
const registerTab = document.getElementById("registerTab");
loginTab.onclick = () => { loginForm.hidden = false; registerForm.hidden = true; loginTab.classList.add("active"); registerTab.classList.remove("active"); message.textContent = ""; };
registerTab.onclick = () => { loginForm.hidden = true; registerForm.hidden = false; registerTab.classList.add("active"); loginTab.classList.remove("active"); message.textContent = ""; };
async function postJSON(url, data) {
  const response = await fetch(url, { method: "POST", body: JSON.stringify(data) });
  return response.json();
}
loginForm.onsubmit = async (event) => {
  event.preventDefault();
  const form = new FormData(loginForm);
  const result = await postJSON("/publish/auth/login", { username: form.get("username"), password: form.get("password") });
  if (result.code === 0) location.href = "/";
  else message.textContent = result.msg || "账号或密码错误，或账号不可用";
};
registerForm.onsubmit = async (event) => {
  event.preventDefault();
  const form = new FormData(registerForm);
  if (form.get("password") !== form.get("confirmPassword")) { message.textContent = "两次输入的密码不一致"; return; }
  const result = await postJSON("/publish/auth/register", { username: form.get("username"), password: form.get("password"), nickname: form.get("nickname") });
  message.textContent = result.msg || (result.code === 0 ? "申请已提交，请等待审核" : "提交失败");
};
</script>
</body>
</html>`
```

- [ ] **Step 2: Run proxy tests**

Run:

```powershell
go test ./server/proxy -run Publish -count=1
```

Expected: PASS.

- [ ] **Step 3: Commit visitor page polish**

Run:

```powershell
gofmt -w server/proxy/publish_auth.go
git status --short
git add -- server/proxy/publish_auth.go
git commit -m "feat: polish publish visitor login page"
```

Expected: commit includes only `kernel/server/proxy/publish_auth.go`.

## Task 6: Final Verification

**Files:**
- Read-only verification across changed files.

- [ ] **Step 1: Run focused backend tests**

Run:

```powershell
go test ./model -run PublishUser -count=1
go test ./server/proxy -run Publish -count=1
go test ./api -run PublishUser -count=1
```

Expected: all PASS.

- [ ] **Step 2: Run broader backend smoke tests**

Run:

```powershell
go test ./model ./server/proxy ./api -count=1
```

Expected: PASS. If unrelated pre-existing tests fail, record the failing package and exact error before deciding whether the implementation is affected.

- [ ] **Step 3: Run frontend check**

Run:

```powershell
pnpm --dir app run dev
```

Expected: first webpack development compile completes without syntax or TypeScript errors.

- [ ] **Step 4: Check official-service removal stays intact**

Run:

```powershell
rg -n "/api/account/login|toolbarVIP|menuAccount|startFreeTrial|useActivationcode" app/src kernel -g "!app/node_modules/**" -g "!app/stage/**" -g "!app/src/asset/pdf/**"
```

Expected: no new official account UI is introduced by this work. Existing backend compatibility routes may still appear in `kernel/api/router.go` or `kernel/api/account.go`; do not change them in this task.

- [ ] **Step 5: Inspect final diff**

Run:

```powershell
git status --short
git log --oneline -5
```

Expected: only intentional files are modified or committed for this feature. Pre-existing unrelated workspace changes remain unstaged.

## Self-Review

- Spec coverage: Tasks cover account storage, bcrypt hashing, visitor registration/login/logout, generic login failure, Basic Auth compatibility, management API, management UI, visitor page, and verification.
- Scope: The plan does not add per-account document permissions, email, visitor password reset, CAPTCHA, invite codes, or official account services.
- Type consistency: The status values are consistently `pending`, `approved`, `rejected`, and `disabled`; frontend `Config.IPublishUser` matches backend `PublishUserPublic`.
- Red-flag scan: The plan contains no known incomplete-work markers outside this self-review section.
