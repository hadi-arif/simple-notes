package main

import (
	"testing"
	"time"
)

func TestHashAndCheckPassword(t *testing.T) {
	hash, err := hashPassword("rahasia123")
	if err != nil {
		t.Fatal(err)
	}
	if hash == "rahasia123" {
		t.Fatal("password tidak boleh disimpan sebagai teks polos")
	}
	if !checkPassword(hash, "rahasia123") {
		t.Error("password yang benar seharusnya cocok")
	}
	if checkPassword(hash, "salah") {
		t.Error("password yang salah seharusnya ditolak")
	}
}

func TestTokenRoundTrip(t *testing.T) {
	secret := []byte("rahasia-tes")
	raw, err := generateToken(secret, 7, "hadi", time.Hour)
	if err != nil {
		t.Fatal(err)
	}
	claims, err := parseToken(secret, raw)
	if err != nil {
		t.Fatalf("token valid seharusnya bisa dibaca: %v", err)
	}
	if claims.UserID != 7 || claims.Username != "hadi" {
		t.Errorf("isi token salah: %+v", claims)
	}
}

func TestTokenRejected(t *testing.T) {
	secret := []byte("rahasia-tes")

	raw, _ := generateToken(secret, 1, "a", time.Hour)
	if _, err := parseToken([]byte("kunci-lain"), raw); err == nil {
		t.Error("token dengan kunci berbeda seharusnya ditolak")
	}

	expired, _ := generateToken(secret, 1, "a", -time.Minute)
	if _, err := parseToken(secret, expired); err == nil {
		t.Error("token kedaluwarsa seharusnya ditolak")
	}

	if _, err := parseToken(secret, "bukan.token.jwt"); err == nil {
		t.Error("token acak seharusnya ditolak")
	}
}
