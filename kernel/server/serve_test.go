package server

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/siyuan-note/siyuan/kernel/conf"
	"github.com/siyuan-note/siyuan/kernel/model"
	"github.com/siyuan-note/siyuan/kernel/util"
)

func TestServeAuthPageUsesTNoteTitle(t *testing.T) {
	gin.SetMode(gin.TestMode)

	oldWorkingDir := util.WorkingDir
	oldConf := model.Conf
	oldLangs := util.Langs
	oldTrayMenuLangs := util.TrayMenuLangs
	oldLang := util.Lang
	t.Cleanup(func() {
		util.WorkingDir = oldWorkingDir
		model.Conf = oldConf
		util.Langs = oldLangs
		util.TrayMenuLangs = oldTrayMenuLangs
		util.Lang = oldLang
	})

	tempDir := t.TempDir()
	stageDir := filepath.Join(tempDir, "stage")
	if err := os.MkdirAll(stageDir, 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(stageDir, "auth.html"), []byte("<title>{{.l6}}</title>"), 0644); err != nil {
		t.Fatal(err)
	}

	keymap := conf.Keymap{}
	model.Conf = model.NewAppConf()
	model.Conf.Lang = "en_US"
	model.Conf.Appearance = &conf.Appearance{}
	model.Conf.Keymap = &keymap
	util.WorkingDir = tempDir
	util.Lang = "en_US"
	util.Langs = map[string]map[int]string{
		"en_US": {
			178: "Access Authorization - SiYuan",
		},
	}
	util.TrayMenuLangs = map[string]map[string]any{"en_US": {}}

	router := gin.New()
	router.GET("/check-auth", serveAuthPage)

	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, httptest.NewRequest(http.MethodGet, "/check-auth", nil))

	if recorder.Code != http.StatusOK {
		t.Fatalf("unexpected status: %d", recorder.Code)
	}
	body := recorder.Body.String()
	if !strings.Contains(body, "<title>TNOTE</title>") {
		t.Fatalf("expected TNOTE title, got %q", body)
	}
	if strings.Contains(body, "SiYuan") || strings.Contains(body, "思源笔记") {
		t.Fatalf("auth page title still contains SiYuan branding: %q", body)
	}
}

func TestServeFixedStaticFilesServesStageFaviconICO(t *testing.T) {
	gin.SetMode(gin.TestMode)

	oldWorkingDir := util.WorkingDir
	t.Cleanup(func() {
		util.WorkingDir = oldWorkingDir
	})

	tempDir := t.TempDir()
	stageDir := filepath.Join(tempDir, "stage")
	if err := os.MkdirAll(stageDir, 0755); err != nil {
		t.Fatal(err)
	}
	faviconBytes := []byte("ico bytes")
	if err := os.WriteFile(filepath.Join(stageDir, "favicon.ico"), faviconBytes, 0644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(stageDir, "icon.png"), []byte("png bytes"), 0644); err != nil {
		t.Fatal(err)
	}

	util.WorkingDir = tempDir

	router := gin.New()
	serveFixedStaticFiles(router)

	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, httptest.NewRequest(http.MethodGet, "/favicon.ico", nil))

	if recorder.Code != http.StatusOK {
		t.Fatalf("unexpected status: %d", recorder.Code)
	}
	if got := recorder.Body.String(); got != string(faviconBytes) {
		t.Fatalf("expected favicon.ico bytes, got %q", got)
	}
}
