package main

import (
	"fmt"
	"log"
	"regexp"
	"strings"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var dbNamePattern = regexp.MustCompile(`^[A-Za-z0-9_]+$`)

// quote membungkus nilai DSN dengan tanda kutip supaya spasi atau karakter khusus aman.
func quote(v string) string {
	v = strings.ReplaceAll(v, `\`, `\\`)
	v = strings.ReplaceAll(v, `'`, `\'`)
	return "'" + v + "'"
}

func buildDSN(cfg Config, dbname string) string {
	sslmode := cfg.DBSSLMode
	if sslmode == "" {
		sslmode = "disable"
	}
	return fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s TimeZone=UTC",
		quote(cfg.DBHost), quote(cfg.DBPort), quote(cfg.DBUser), quote(cfg.DBPassword), quote(dbname), quote(sslmode))
}

// mainDSN memilih DATABASE_URL (dipakai layanan hosting) bila ada, kalau tidak merakit dari DB_*.
func mainDSN(cfg Config) string {
	if cfg.DatabaseURL != "" {
		return cfg.DatabaseURL
	}
	return buildDSN(cfg, cfg.DBName)
}

// ensureDatabase membuat database bila belum ada, supaya pengguna tidak perlu menjalankan SQL manual.
func ensureDatabase(cfg Config) error {
	admin, err := gorm.Open(postgres.Open(buildDSN(cfg, "postgres")), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		return err
	}
	sqlDB, err := admin.DB()
	if err != nil {
		return err
	}
	defer sqlDB.Close()

	var exists bool
	if err := admin.Raw("SELECT EXISTS (SELECT 1 FROM pg_database WHERE datname = ?)", cfg.DBName).Scan(&exists).Error; err != nil {
		return err
	}
	if exists {
		return nil
	}
	if !dbNamePattern.MatchString(cfg.DBName) {
		return fmt.Errorf("nama database %q hanya boleh berisi huruf, angka, dan garis bawah", cfg.DBName)
	}
	log.Printf("Database %q belum ada, membuat...", cfg.DBName)
	return admin.Exec(`CREATE DATABASE "` + cfg.DBName + `"`).Error
}

func connectDB(cfg Config) (*gorm.DB, error) {
	// Membuat database otomatis hanya untuk pengembangan lokal. Layanan hosting (DATABASE_URL)
	// sudah menyediakan databasenya, dan akunnya biasanya tidak boleh membuat database baru.
	if cfg.DatabaseURL == "" {
		if err := ensureDatabase(cfg); err != nil {
			log.Printf("Peringatan: tidak bisa memeriksa atau membuat database otomatis: %v", err)
		}
	}

	db, err := gorm.Open(postgres.Open(mainDSN(cfg)), &gorm.Config{TranslateError: true})
	if err != nil {
		return nil, fmt.Errorf("tidak bisa terhubung ke PostgreSQL (cek DATABASE_URL, atau DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_SSLMODE): %w", err)
	}
	if err := db.AutoMigrate(&User{}, &Note{}); err != nil {
		return nil, fmt.Errorf("gagal membuat tabel: %w", err)
	}
	return db, nil
}
