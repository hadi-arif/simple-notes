package main

import (
	"errors"
	"regexp"
	"strings"
	"unicode/utf8"
)

const (
	maxTitleLen   = 120
	maxContentLen = 10000
)

var usernamePattern = regexp.MustCompile(`^[a-z0-9_]{3,30}$`)

var allowedColors = map[string]bool{
	"sun": true, "mint": true, "sky": true, "rose": true, "lilac": true, "peach": true,
}

func normalizeUsername(s string) string {
	return strings.ToLower(strings.TrimSpace(s))
}

func validateCredentials(username, password string) error {
	if !usernamePattern.MatchString(username) {
		return errors.New("Username harus 3-30 karakter: huruf, angka, atau garis bawah")
	}
	if len(password) < 6 {
		return errors.New("Password minimal 6 karakter")
	}
	if len(password) > 72 {
		return errors.New("Password maksimal 72 karakter")
	}
	return nil
}

// noteInput memakai pointer supaya update bisa sebagian (misalnya hanya mengubah pin).
type noteInput struct {
	Title   *string `json:"title"`
	Content *string `json:"content"`
	Color   *string `json:"color"`
	Pinned  *bool   `json:"pinned"`
}

// applyNoteInput memvalidasi field yang dikirim lalu menerapkannya ke catatan.
func applyNoteInput(n *Note, in noteInput) error {
	if in.Title != nil {
		t := strings.TrimSpace(*in.Title)
		if utf8.RuneCountInString(t) > maxTitleLen {
			return errors.New("Judul terlalu panjang (maksimal 120 karakter)")
		}
		n.Title = t
	}
	if in.Content != nil {
		if utf8.RuneCountInString(*in.Content) > maxContentLen {
			return errors.New("Isi catatan terlalu panjang (maksimal 10.000 karakter)")
		}
		n.Content = *in.Content
	}
	if in.Color != nil {
		if !allowedColors[*in.Color] {
			return errors.New("Warna tidak dikenal")
		}
		n.Color = *in.Color
	}
	if in.Pinned != nil {
		n.Pinned = *in.Pinned
	}
	if strings.TrimSpace(n.Title) == "" && strings.TrimSpace(n.Content) == "" {
		return errors.New("Tulis judul atau isi catatan dulu")
	}
	return nil
}
