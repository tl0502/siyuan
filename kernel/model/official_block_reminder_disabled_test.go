package model

import (
	"errors"
	"testing"
)

func TestOfficialBlockReminderDisabled(t *testing.T) {
	withOfficialServiceTestConf(t, func() {
		if err := SetBlockReminder("20240101000000-abcdefg", "20250101000000"); !errors.Is(err, ErrOfficialServiceDisabled) {
			t.Fatalf("SetBlockReminder() error = %v, want ErrOfficialServiceDisabled", err)
		}
	})
}
