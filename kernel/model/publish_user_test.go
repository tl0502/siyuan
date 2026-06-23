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
