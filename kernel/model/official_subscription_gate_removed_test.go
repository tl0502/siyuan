package model

import (
	"testing"

	"github.com/siyuan-note/siyuan/kernel/conf"
)

func TestPreservedSyncProvidersDoNotRequireOfficialPayment(t *testing.T) {
	providers := []int{conf.ProviderS3, conf.ProviderWebDAV, conf.ProviderLocal}
	for _, provider := range providers {
		t.Run(conf.ProviderToStr(provider), func(t *testing.T) {
			withSyncProvider(t, provider, true, func() {
				Conf.User = nil
				if !checkSync(false, false, true) {
					t.Fatalf("checkSync() with provider %s returned false without official paid user", conf.ProviderToStr(provider))
				}
				if !Conf.Sync.Enabled {
					t.Fatalf("checkSync() disabled sync for provider %s without official paid user", conf.ProviderToStr(provider))
				}
			})
		})
	}
}
