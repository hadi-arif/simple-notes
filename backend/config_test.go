package main

import (
	"reflect"
	"strings"
	"testing"
)

func TestParseOrigins(t *testing.T) {
	got := parseOrigins(" https://notes.example.com/ , http://localhost:3000,, ")
	want := []string{"https://notes.example.com", "http://localhost:3000"}
	if !reflect.DeepEqual(got, want) {
		t.Errorf("got %v, ingin %v", got, want)
	}
}

func TestBuildDSNSSLMode(t *testing.T) {
	cfg := Config{DBHost: "db.example.com", DBPort: "5432", DBUser: "u", DBPassword: "p w'd", DBName: "notes"}
	if dsn := buildDSN(cfg, cfg.DBName); !strings.Contains(dsn, "sslmode='disable'") {
		t.Errorf("sslmode bawaan harus disable: %s", dsn)
	}
	cfg.DBSSLMode = "require"
	dsn := buildDSN(cfg, cfg.DBName)
	if !strings.Contains(dsn, "sslmode='require'") {
		t.Errorf("sslmode require tidak terpakai: %s", dsn)
	}
	if !strings.Contains(dsn, `password='p w\'d'`) {
		t.Errorf("password dengan spasi dan tanda kutip harus di-escape: %s", dsn)
	}
}

func TestMainDSNPrefersDatabaseURL(t *testing.T) {
	cfg := Config{DBHost: "localhost", DBPort: "5432", DBUser: "u", DBPassword: "p", DBName: "n"}
	if got := mainDSN(cfg); !strings.Contains(got, "host='localhost'") {
		t.Errorf("tanpa DATABASE_URL harus merakit dari DB_*: %s", got)
	}
	cfg.DatabaseURL = "postgres://user:pass@db.example.com/notes?sslmode=require"
	if got := mainDSN(cfg); got != cfg.DatabaseURL {
		t.Errorf("DATABASE_URL harus dipakai langsung, dapat %s", got)
	}
}

func TestLoadConfigReadsEnvironment(t *testing.T) {
	t.Setenv("DATABASE_URL", "postgres://a:b@host/db")
	t.Setenv("DB_SSLMODE", "require")
	t.Setenv("JWT_SECRET", "rahasia-panjang-untuk-tes")
	t.Setenv("PORT", "10000")
	t.Setenv("ALLOWED_ORIGINS", "https://notes.example.com/")
	cfg := loadConfig()
	if cfg.DatabaseURL != "postgres://a:b@host/db" || cfg.DBSSLMode != "require" || cfg.Port != "10000" {
		t.Errorf("config salah: %+v", cfg)
	}
	if len(cfg.AllowedOrigins) != 1 || cfg.AllowedOrigins[0] != "https://notes.example.com" {
		t.Errorf("origins salah: %v", cfg.AllowedOrigins)
	}
}
