package main

import (
	"log"
	"os"
	"strings"

	"github.com/joho/godotenv"
)

// Config menyimpan semua pengaturan yang dibaca dari environment / file .env.
type Config struct {
	DatabaseURL    string // bila diisi (DATABASE_URL), dipakai langsung dan DB_* diabaikan
	DBHost         string
	DBPort         string
	DBUser         string
	DBPassword     string
	DBName         string
	DBSSLMode      string
	JWTSecret      []byte
	Port           string
	AllowedOrigins []string
}

const devJWTSecret = "dev-secret-ganti-di-produksi"

func getenv(key, fallback string) string {
	if v := strings.TrimSpace(os.Getenv(key)); v != "" {
		return v
	}
	return fallback
}

// parseOrigins memecah daftar origin yang dipisah koma dan membuang garis miring di akhir,
// karena browser mengirim Origin tanpa garis miring.
func parseOrigins(raw string) []string {
	origins := []string{}
	for _, o := range strings.Split(raw, ",") {
		if o = strings.TrimRight(strings.TrimSpace(o), "/"); o != "" {
			origins = append(origins, o)
		}
	}
	return origins
}

func loadConfig() Config {
	// File .env bersifat opsional: di server produksi nilai biasanya datang dari environment.
	if err := godotenv.Load(); err != nil {
		log.Println("File .env tidak ditemukan, memakai environment dan nilai bawaan")
	}

	secret := getenv("JWT_SECRET", devJWTSecret)
	if secret == devJWTSecret {
		if os.Getenv("GIN_MODE") == "release" {
			log.Fatal("JWT_SECRET wajib diisi di mode produksi (GIN_MODE=release). Buat dengan: openssl rand -hex 32")
		}
		log.Println("PERINGATAN: JWT_SECRET belum diisi, memakai kunci bawaan. Isi di file .env sebelum dipakai sungguhan.")
	}

	return Config{
		DatabaseURL:    getenv("DATABASE_URL", ""),
		DBHost:         getenv("DB_HOST", "localhost"),
		DBPort:         getenv("DB_PORT", "5432"),
		DBUser:         getenv("DB_USER", "postgres"),
		DBPassword:     getenv("DB_PASSWORD", "postgres"),
		DBName:         getenv("DB_NAME", "notes_db"),
		DBSSLMode:      getenv("DB_SSLMODE", "disable"),
		JWTSecret:      []byte(secret),
		Port:           getenv("PORT", "8080"),
		AllowedOrigins: parseOrigins(getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")),
	}
}
