package model

import (
	"errors"
	"testing"

	"github.com/siyuan-note/siyuan/kernel/conf"
)

func withSyncProvider(t *testing.T, provider int, enabled bool, fn func()) {
	t.Helper()

	oldConf := Conf
	Conf = NewAppConf()
	Conf.System = conf.NewSystem()
	Conf.Repo = conf.NewRepo()
	Conf.Sync = conf.NewSync()
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

func TestOfficialSyncProviderCannotBeEnabled(t *testing.T) {
	withSyncProvider(t, conf.ProviderSiYuan, false, func() {
		SetSyncEnable(true)
		if Conf.Sync.Enabled {
			t.Fatal("SetSyncEnable(true) enabled sync with ProviderSiYuan, want disabled")
		}
	})
}

func TestOfficialSyncPerceptionCannotBeEnabled(t *testing.T) {
	withSyncProvider(t, conf.ProviderSiYuan, false, func() {
		SetSyncPerception(true)
		if Conf.Sync.Perception {
			t.Fatal("SetSyncPerception(true) enabled perception with ProviderSiYuan, want disabled")
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

func TestOfficialSyncPerceptionDoesNotConnect(t *testing.T) {
	withSyncProvider(t, conf.ProviderLocal, true, func() {
		Conf.Sync.Perception = true
		connectSyncWebSocket()
		if webSocketConn != nil {
			t.Fatal("connectSyncWebSocket() created a websocket, want nil")
		}
	})
}
