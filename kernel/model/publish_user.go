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
