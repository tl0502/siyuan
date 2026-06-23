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
	Conf.Sync.Local = &conf.Local{}
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
		if err := noPanicErr(t, "RemoveCloudShorthands", func() error {
			return RemoveCloudShorthands([]string{"1"})
		}); !errors.Is(err, ErrOfficialServiceDisabled) {
			t.Fatalf("RemoveCloudShorthands() error = %v, want ErrOfficialServiceDisabled", err)
		}
		var shorthand map[string]any
		if err := noPanicErr(t, "GetCloudShorthand", func() (err error) {
			shorthand, err = GetCloudShorthand("1")
			return
		}); !errors.Is(err, ErrOfficialServiceDisabled) || shorthand != nil {
			t.Fatalf("GetCloudShorthand() = (%v, %v), want nil and ErrOfficialServiceDisabled", shorthand, err)
		}
		var shorthands map[string]any
		if err := noPanicErr(t, "GetCloudShorthands", func() (err error) {
			shorthands, err = GetCloudShorthands(1)
			return
		}); !errors.Is(err, ErrOfficialServiceDisabled) || shorthands != nil {
			t.Fatalf("GetCloudShorthands() = (%v, %v), want nil and ErrOfficialServiceDisabled", shorthands, err)
		}
	})
}

func noPanicErr(t *testing.T, name string, fn func() error) (err error) {
	t.Helper()
	defer func() {
		if recovered := recover(); recovered != nil {
			t.Fatalf("%s panicked, want ErrOfficialServiceDisabled: %v", name, recovered)
		}
	}()
	return fn()
}
