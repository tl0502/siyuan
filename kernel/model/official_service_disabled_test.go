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
