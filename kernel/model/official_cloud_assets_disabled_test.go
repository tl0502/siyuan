package model

import (
	"errors"
	"testing"
)

func TestOfficialCloudAssetsDisabled(t *testing.T) {
	withOfficialServiceTestConf(t, func() {
		if count, err := UploadAssets2Cloud("20240101000000-abcdefg", true); !errors.Is(err, ErrOfficialServiceDisabled) || count != 0 {
			t.Fatalf("UploadAssets2Cloud() = (%d, %v), want 0 and ErrOfficialServiceDisabled", count, err)
		}
		if count, err := UploadAssets2CloudByAssetsPaths([]string{"assets/a.png"}, true); !errors.Is(err, ErrOfficialServiceDisabled) || count != 0 {
			t.Fatalf("UploadAssets2CloudByAssetsPaths() = (%d, %v), want 0 and ErrOfficialServiceDisabled", count, err)
		}
		if err := Export2Liandi("20240101000000-abcdefg"); !errors.Is(err, ErrOfficialServiceDisabled) {
			t.Fatalf("Export2Liandi() error = %v, want ErrOfficialServiceDisabled", err)
		}
	})
}
