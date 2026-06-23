package util

import (
	"context"
	"testing"
)

func TestOfficialRhyResultDisabled(t *testing.T) {
	result, err := GetRhyResult(context.Background(), true)
	if err != nil {
		t.Fatalf("GetRhyResult() error = %v, want nil", err)
	}
	if len(result) != 0 {
		t.Fatalf("GetRhyResult() length = %d, want 0", len(result))
	}
}

func TestOfficialRhyBazaarHashDisabled(t *testing.T) {
	if hash := GetRhyBazaarHash(context.Background()); hash != "" {
		t.Fatalf("GetRhyBazaarHash() = %q, want empty", hash)
	}
}
