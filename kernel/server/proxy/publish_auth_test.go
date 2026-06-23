package proxy

import (
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"strings"
	"testing"

	"github.com/siyuan-note/siyuan/kernel/conf"
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

func TestHandlePublishLoginCreatesSessionForBasicAuthAccount(t *testing.T) {
	withPublishAuthTempDataDir(t)

	originalConf := model.Conf
	model.Conf = model.NewAppConf()
	model.Conf.Publish = conf.NewPublish()
	model.Conf.Publish.Auth.Accounts = []*conf.BasicAuthAccount{{
		Username: "basic",
		Password: "secret-123",
		Memo:     "Legacy account",
	}}
	model.InitAccounts()
	t.Cleanup(func() {
		model.Conf = model.NewAppConf()
		model.Conf.Publish = conf.NewPublish()
		model.InitAccounts()
		model.Conf = originalConf
	})

	request := httptest.NewRequest(http.MethodPost, "/publish/auth/login", strings.NewReader(`{"username":"basic","password":"secret-123"}`))
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

func TestPublishLoginPageCanHideInactiveForm(t *testing.T) {
	if !strings.Contains(publishLoginHTML, "[hidden] { display: none !important; }") {
		t.Fatal("publish login page does not force hidden forms to stay hidden")
	}
	if !strings.Contains(publishLoginHTML, `id="registerForm" class="auth-form" hidden`) {
		t.Fatal("register form is not initially hidden")
	}
}
