package model

import (
	"errors"
	"strings"
	"testing"

	"github.com/siyuan-note/siyuan/kernel/conf"
	"github.com/siyuan-note/siyuan/kernel/util"
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

func TestPreservedSyncProvidersDoNotCarryOfficialCloudServer(t *testing.T) {
	providers := []int{conf.ProviderS3, conf.ProviderWebDAV, conf.ProviderLocal}
	for _, provider := range providers {
		t.Run(conf.ProviderToStr(provider), func(t *testing.T) {
			withSyncProvider(t, provider, true, func() {
				Conf.Sync.S3 = &conf.S3{Endpoint: "https://s3.example.com", Timeout: 30, ConcurrentReqs: 8}
				Conf.Sync.WebDAV = &conf.WebDAV{Endpoint: "https://webdav.example.com", Timeout: 30, ConcurrentReqs: 8}
				Conf.Sync.Local = &conf.Local{Endpoint: t.TempDir(), Timeout: 30, ConcurrentReqs: 8}

				cloudConf, err := buildCloudConf()
				if err != nil {
					t.Fatalf("buildCloudConf() error = %v", err)
				}
				if cloudConf.Server != "" {
					t.Fatalf("buildCloudConf().Server = %q, want empty for provider %s", cloudConf.Server, conf.ProviderToStr(provider))
				}
			})
		})
	}
}

func TestOfficialProviderCloudConfDisabled(t *testing.T) {
	withSyncProvider(t, conf.ProviderSiYuan, true, func() {
		_, err := buildCloudConf()
		if !errors.Is(err, ErrOfficialServiceDisabled) {
			t.Fatalf("buildCloudConf() error = %v, want ErrOfficialServiceDisabled", err)
		}
	})
}

func TestSubscriptionLanguageDoesNotLinkOfficialAccountServer(t *testing.T) {
	oldConf := Conf
	oldLangs := util.Langs
	Conf = NewAppConf()
	Conf.Lang = "en_US"
	util.Langs = map[string]map[int]string{
		"en_US": {
			29: "Subscribe at ${accountServer}/subscribe/siyuan",
		},
	}
	t.Cleanup(func() {
		Conf = oldConf
		util.Langs = oldLangs
	})

	msg := Conf.Language(29)
	if strings.Contains(msg, "ld246.com") || strings.Contains(msg, "liuyun.io") || strings.Contains(msg, "${accountServer}") {
		t.Fatalf("Conf.Language(29) = %q, want no official account server link", msg)
	}
}
