warning: in the working copy of 'README.md', LF will be replaced by CRLF the next time Git touches it
[1mdiff --git a/README.md b/README.md[m
[1mindex a7efadf..b22c5e4 100644[m
[1m--- a/README.md[m
[1m+++ b/README.md[m
[36m@@ -1,47 +1,88 @@[m
 # Simple Notes[m
 [m
[31m-Simple Notes adalah aplikasi pencatatan harian berbasis web [m
[31m-[m
[31m-### Frontend:[m
[31m-- React[m
[31m-- Chakra UI[m
[31m-- React Router[m
[31m-- Axios[m
[31m-[m
[31m-### Backend:[m
[31m-- Golang (Gin Framework)[m
[31m-- PostgreSQL (Relasi Many-to-Many)[m
[31m-- Gorm[m
[31m-- JWT Authentication[m
[31m-[m
[31m-##  Cara Menjalankan[m
[31m-### 1. Clone Repository[m
[31m-```sh[m
[31m-git clone https://github.com/hadi-arif/simple-notes.git[m
[31m-cd notes-app[m
[31m-```[m
[32m+[m[32mAplikasi catatan harian berbasis web. Catatan tampil sebagai kertas tempel di papan tulis: bisa disematkan, diberi warna, dicari, dan diubah lewat editor yang membesar dari kartunya.[m
[32m+[m
[32m+[m[32m**Frontend:** React, Vite, Chakra UI, Framer Motion, React Router, Axios[m
[32m+[m[32m**Backend:** Go (Gin), GORM, PostgreSQL (relasi many-to-many `user_notes`), JWT, bcrypt[m
[32m+[m
[32m+[m[32m## Yang perlu dipasang[m
[32m+[m
[32m+[m[32m- Go 1.24 atau lebih baru[m
[32m+[m[32m- Node.js 20.19 atau lebih baru (atau 22.12+)[m
[32m+[m[32m- PostgreSQL, atau Docker untuk menjalankannya[m
[32m+[m
[32m+[m[32m## Cara menjalankan[m
[32m+[m
[32m+[m[32m### 1. Siapkan PostgreSQL[m
[32m+[m
[32m+[m[32mPilih salah satu:[m
[32m+[m
[32m+[m[32m- **Docker:** jalankan `docker compose up -d` di folder proyek ini.[m
[32m+[m[32m- **PostgreSQL sendiri:** pastikan servernya aktif, lalu isi `DB_USER` dan `DB_PASSWORD` di langkah 2 sesuai akunmu. Database `notes_db` dibuat otomatis kalau belum ada.[m
[32m+[m
[32m+[m[32m### 2. Jalankan backend (terminal pertama)[m
 [m
[31m-### 2. Menjalankan Backend[m
 ```sh[m
 cd backend[m
[31m-cp .env.example .env  # Konfigurasi database[m
[32m+[m[32mcp .env.example .env     # Windows PowerShell: copy .env.example .env[m
 go mod tidy[m
[31m-go run main.go[m
[32m+[m[32mgo run .[m
 ```[m
 [m
[31m-### 3. Menjalankan Frontend[m
[32m+[m[32mBuka `.env` dan sesuaikan `DB_PASSWORD` (dan `JWT_SECRET` dengan teks acak). Server aktif di http://localhost:8080. Gunakan `go run .` (bukan `go run main.go`) karena kodenya terbagi ke beberapa file.[m
[32m+[m
[32m+[m[32m### 3. Jalankan frontend (terminal kedua)[m
[32m+[m
 ```sh[m
 cd frontend[m
 npm install[m
 npm start[m
 ```[m
 [m
[31m-## ✅ Testing[m
[31m-Backend:[m
[32m+[m[32mBuka http://localhost:3000, buat akun lewat tab **Daftar**, lalu mulai menulis.[m
[32m+[m
[32m+[m[32mKalau backend tidak berjalan di port 8080, salin `frontend/.env.example` menjadi `frontend/.env` dan ubah `VITE_API_URL`.[m
[32m+[m
[32m+[m[32m## Pintasan keyboard[m
[32m+[m
[32m+[m[32m| Tombol | Fungsi |[m
[32m+[m[32m| --- | --- |[m
[32m+[m[32m| `N` | Catatan baru |[m
[32m+[m[32m| `/` | Fokus ke kolom pencarian |[m
[32m+[m[32m| `Ctrl/Cmd + Enter` | Simpan catatan di editor |[m
[32m+[m[32m| `Esc` | Tutup editor (ditahan kalau ada perubahan yang belum disimpan) |[m
[32m+[m
[32m+[m[32m## API[m
[32m+[m
[32m+[m[32m| Method | Path | Keterangan |[m
[32m+[m[32m| --- | --- | --- |[m
[32m+[m[32m| POST | `/register` | Buat akun, langsung mengembalikan token |[m
[32m+[m[32m| POST | `/login` | Masuk, mengembalikan token |[m
[32m+[m[32m| GET | `/me` | Data akun yang sedang masuk |[m
[32m+[m[32m| GET | `/notes` | Daftar catatan milikmu (yang disematkan di atas) |[m
[32m+[m[32m| POST | `/notes` | Buat catatan: `title`, `content`, `color`, `pinned` |[m
[32m+[m[32m| PUT | `/notes/:id` | Ubah catatan (boleh sebagian field saja) |[m
[32m+[m[32m| DELETE | `/notes/:id` | Hapus catatan |[m
[32m+[m
[32m+[m[32mSemua endpoint `/notes` dan `/me` memakai header `Authorization: Bearer <token>`. Warna yang diizinkan: `sun`, `mint`, `sky`, `rose`, `lilac`, `peach`.[m
[32m+[m
[32m+[m[32m## Testing[m
[32m+[m
 ```sh[m
[31m-go test ./...[m
[32m+[m[32mcd backend && go test ./...      # password, token JWT, validasi, middleware, CORS[m
[32m+[m[32mcd frontend && npm test          # halaman masuk, papan catatan, editor, pencarian, hapus[m
 ```[m
[31m-Frontend:[m
[31m-```sh[m
[31m-npm test[m
[32m+[m
[32m+[m[32m## Deploy[m
[32m+[m
[32m+[m[32mPanduan lengkap ada di [DEPLOY.md](DEPLOY.md): jalur cepat lewat Render Blueprint (`render.yaml`) atau manual ke penyedia lain.[m
[32m+[m
[32m+[m[32m## Struktur[m
[32m+[m
[32m+[m[32m```[m
[32m+[m[32mbackend/    server Go (main.go, router.go, handlers.go, auth.go, ...)[m
[32m+[m[32mfrontend/   aplikasi React (src/pages, src/components, src/hooks.js, ...)[m
[32m+[m[32mdocker-compose.yml   PostgreSQL untuk pengembangan[m
[32m+[m[32mrender.yaml          Blueprint deploy ke Render[m
[32m+[m[32mDEPLOY.md            panduan deploy[m
 ```[m
