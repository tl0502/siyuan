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
