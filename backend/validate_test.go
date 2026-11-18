package main

import (
	"strings"
	"testing"
)

func str(s string) *string { return &s }
func boolean(b bool) *bool { return &b }

func TestValidateCredentials(t *testing.T) {
	cases := []struct {
		user, pass string
		ok         bool
	}{
		{"hadi", "123456", true},
		{"hadi_01", "123456", true},
		{"ab", "123456", false},
		{"nama dengan spasi", "123456", false},
		{"hadi", "123", false},
		{"hadi", strings.Repeat("x", 73), false},
	}
	for _, c := range cases {
		err := validateCredentials(normalizeUsername(c.user), c.pass)
		if (err == nil) != c.ok {
			t.Errorf("validateCredentials(%q, %q) = %v, ingin ok=%v", c.user, c.pass, err, c.ok)
		}
	}
}

func TestNormalizeUsername(t *testing.T) {
	if got := normalizeUsername("  Hadi_01 "); got != "hadi_01" {
		t.Errorf("got %q", got)
	}
}

func TestApplyNoteInput(t *testing.T) {
	n := Note{Color: "sun"}
	if err := applyNoteInput(&n, noteInput{Title: str("  Belanja  "), Content: str("susu, telur")}); err != nil {
		t.Fatal(err)
	}
	if n.Title != "Belanja" || n.Content != "susu, telur" {
		t.Errorf("hasil salah: %+v", n)
	}

	if err := applyNoteInput(&n, noteInput{Pinned: boolean(true), Color: str("mint")}); err != nil {
		t.Fatal(err)
	}
	if !n.Pinned || n.Color != "mint" || n.Title != "Belanja" {
		t.Errorf("update sebagian harus menjaga field lain: %+v", n)
	}
}

func TestApplyNoteInputRejects(t *testing.T) {
	empty := Note{Color: "sun"}
	if err := applyNoteInput(&empty, noteInput{Title: str("   "), Content: str("")}); err == nil {
		t.Error("catatan kosong seharusnya ditolak")
	}
	n := Note{Title: "ada", Color: "sun"}
	if err := applyNoteInput(&n, noteInput{Color: str("hitam-pekat")}); err == nil {
		t.Error("warna tidak dikenal seharusnya ditolak")
	}
	if err := applyNoteInput(&n, noteInput{Title: str(strings.Repeat("a", maxTitleLen+1))}); err == nil {
		t.Error("judul terlalu panjang seharusnya ditolak")
	}
}
