# Simple Notes

Aplikasi catatan harian berbasis web. Catatan tampil sebagai kertas tempel di papan tulis: bisa disematkan, diberi warna, dicari, dan diubah lewat editor yang membesar dari kartunya.

**Frontend:** React, Vite, Chakra UI, Framer Motion, React Router, Axios
**Backend:** Go (Gin), GORM, PostgreSQL (relasi many-to-many `user_notes`), JWT, bcrypt

## Yang perlu dipasang

- Go 1.24 atau lebih baru
- Node.js 20.19 atau lebih baru (atau 22.12+)
- PostgreSQL, atau Docker untuk menjalankannya

## Cara menjalankan

### 1. Siapkan PostgreSQL

Pilih salah satu:

- **Docker:** jalankan `docker compose up -d` di folder proyek ini.
- **PostgreSQL sendiri:** pastikan servernya aktif, lalu isi `DB_USER` dan `DB_PASSWORD` di langkah 2 sesuai akunmu. Database `notes_db` dibuat otomatis kalau belum ada.

### 2. Jalankan backend (terminal pertama)

```sh
cd backend
cp .env.example .env     # Windows PowerShell: copy .env.example .env
go mod tidy
go run .
```

Buka `.env` dan sesuaikan `DB_PASSWORD` (dan `JWT_SECRET` dengan teks acak). Server aktif di http://localhost:8080. Gunakan `go run .` (bukan `go run main.go`) karena kodenya terbagi ke beberapa file.

### 3. Jalankan frontend (terminal kedua)

```sh
cd frontend
npm install
npm start
```

Buka http://localhost:3000, buat akun lewat tab **Daftar**, lalu mulai menulis.

Kalau backend tidak berjalan di port 8080, salin `frontend/.env.example` menjadi `frontend/.env` dan ubah `VITE_API_URL`.

## Pintasan keyboard

| Tombol | Fungsi |
| --- | --- |
| `N` | Catatan baru |
| `/` | Fokus ke kolom pencarian |
| `Ctrl/Cmd + Enter` | Simpan catatan di editor |
| `Esc` | Tutup editor (ditahan kalau ada perubahan yang belum disimpan) |

## API

| Method | Path | Keterangan |
| --- | --- | --- |
| POST | `/register` | Buat akun, langsung mengembalikan token |
| POST | `/login` | Masuk, mengembalikan token |
| GET | `/me` | Data akun yang sedang masuk |
| GET | `/notes` | Daftar catatan milikmu (yang disematkan di atas) |
| POST | `/notes` | Buat catatan: `title`, `content`, `color`, `pinned` |
| PUT | `/notes/:id` | Ubah catatan (boleh sebagian field saja) |
| DELETE | `/notes/:id` | Hapus catatan |

Semua endpoint `/notes` dan `/me` memakai header `Authorization: Bearer <token>`. Warna yang diizinkan: `sun`, `mint`, `sky`, `rose`, `lilac`, `peach`.

## Testing

```sh
cd backend && go test ./...      # password, token JWT, validasi, middleware, CORS
cd frontend && npm test          # halaman masuk, papan catatan, editor, pencarian, hapus
```

## Deploy

Panduan lengkap ada di [DEPLOY.md](DEPLOY.md): jalur cepat lewat Render Blueprint (`render.yaml`) atau manual ke penyedia lain.

## Struktur

```
backend/    server Go (main.go, router.go, handlers.go, auth.go, ...)
frontend/   aplikasi React (src/pages, src/components, src/hooks.js, ...)
docker-compose.yml   PostgreSQL untuk pengembangan
render.yaml          Blueprint deploy ke Render
DEPLOY.md            panduan deploy
```
