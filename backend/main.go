package main

import "log"

func main() {
	cfg := loadConfig()

	db, err := connectDB(cfg)
	if err != nil {
		log.Fatalf("Gagal menyiapkan database: %v", err)
	}

	app := &App{db: db, cfg: cfg}
	log.Printf("Server berjalan di http://localhost:%s", cfg.Port)
	if err := newRouter(app).Run(":" + cfg.Port); err != nil {
		log.Fatal(err)
	}
}
