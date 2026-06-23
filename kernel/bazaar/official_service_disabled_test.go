package bazaar

import (
	"strings"
	"testing"

	"github.com/siyuan-note/siyuan/kernel/util"
)

func TestBazaarStageIndexUsesPublicRepository(t *testing.T) {
	u := bazaarStageIndexURL("plugins")
	if !strings.HasPrefix(u, util.BazaarStageServer+"/stage/") {
		t.Fatalf("bazaarStageIndexURL() = %q, want public bazaar stage server", u)
	}
	if strings.Contains(u, "/apis/siyuan/") || strings.Contains(u, "bazaar@") {
		t.Fatalf("bazaarStageIndexURL() = %q, want no official API or Rhy hash dependency", u)
	}
}
