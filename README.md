# Simple Notes

Aplikasi catatan harian berbasis web. Catatan tampil sebagai kertas tempel di papan tulis hijau: bisa diberi warna, disematkan, dicari, dan diubah lewat editor yang membesar langsung dari kartunya.

![Tampilan Simple Notes](docs/screenshot.png)

## Fitur

- Daftar dan masuk dengan username dan password (JWT, password disimpan dengan bcrypt)
- Tambah, ubah, dan hapus catatan. Setiap pengguna hanya bisa melihat catatannya sendiri
- Enam warna kertas, sematkan catatan penting, pencarian, dan filter warna
- Animasi: kartu jatuh saat papan dimuat, editor membesar dari kartu, pin memantul, kartu melayang saat dihapus. Animasi mengikuti pengaturan "reduce motion" di sistem
- Pintasan keyboard: `N` catatan baru, `/` cari, `Ctrl/Cmd + Enter` simpan, `Esc` tutup editor
- Editor menahan penutupan kalau ada tulisan yang belum disimpan


| Bagian | Yang dipakai |
| --- | --- |
| Frontend | React 19, Vite, Chakra UI v3, Framer Motion, React Router, Axios |
| Backend | Go, Gin, GORM, JWT, bcrypt |
| Database | PostgreSQL (relasi many-to-many `users` dan `notes` lewat tabel `user_notes`) |
| Pengujian | `go test` (backend), Vitest dan Testing Library (frontend) |


### Yang perlu dipasang

- [Go](https://go.dev/dl/) 1.24 atau lebih baru
- [Node.js](https://nodejs.org/) 20.19 atau lebih baru
- Database PostgreSQL, salah satu dari:
  - akun gratis [Neon](https://neon.com) (tanpa kartu kredit), atau
  - PostgreSQL lokal, atau Docker untuk menjalankan `docker-compose.yml`

### 1. Ambil kode

```sh
git clone https://github.com/hadi-arif/simple-notes.git
cd simple-notes
```

### 2. Backend

```sh
cd backend
cp .env.example .env        # Windows PowerShell: copy .env.example .env
```

Buka `.env` dan isi:

- **Memakai Neon atau database di layanan hosting:** hapus tanda `#` pada baris `DATABASE_URL` dan isi dengan connection string, misalnya `postgresql://user:password@host/neondb?sslmode=require`.
- **Memakai PostgreSQL lokal atau Docker:** biarkan `DATABASE_URL` tetap dikomentari dan sesuaikan `DB_USER`, `DB_PASSWORD`, dan `DB_NAME`. Database dibuat otomatis kalau belum ada.
- Ubah `JWT_SECRET` dengan teks acak minimal 32 karakter.

Lalu jalankan:

```sh
go mod tidy
go run .
```

Server aktif di http://localhost:8080. Cek dengan membuka `/health`.

Kalau memakai Docker untuk database, jalankan `docker compose up -d` dari akar proyek sebelum menjalankan backend.

### 3. Frontend (terminal kedua)

```sh
cd frontend
npm install
npm start
```

Buka http://localhost:3000, daftar lewat tab **Daftar**, lalu mulai menulis.

> **Windows:** kalau `npm` ditolak dengan pesan "running scripts is disabled", jalankan sekali `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` di PowerShell, atau pakai Command Prompt.

Dua terminal harus terbuka bersamaan selama aplikasi dipakai: satu untuk backend, satu untuk frontend.

## Konfigurasi

### Backend (`backend/.env`)

| Variabel | Keterangan | Bawaan |
| --- | --- | --- |
| `DATABASE_URL` | Connection string PostgreSQL. Kalau diisi, `DB_*` diabaikan | kosong |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Koneksi PostgreSQL lokal | `localhost`, `5432`, `postgres`, `postgres`, `notes_db` |
| `DB_SSLMODE` | Mode SSL, isi `require` kalau database mewajibkan | `disable` |
| `JWT_SECRET` | Kunci penanda tangan token. Di mode produksi wajib diisi | kunci bawaan (khusus pengembangan) |
| `PORT` | Port server | `8080` |
| `ALLOWED_ORIGINS` | Alamat frontend yang boleh mengakses API, pisahkan dengan koma | `http://localhost:3000,http://127.0.0.1:3000` |

### Frontend (`frontend/.env`, opsional)

| Variabel | Keterangan | Bawaan |
| --- | --- | --- |
| `VITE_API_URL` | Alamat backend. Tertanam saat build | `http://localhost:8080` |

## API

Semua endpoint `/notes` dan `/me` memakai header `Authorization: Bearer <token>`.

| Method | Path | Keterangan |
| --- | --- | --- |
| GET | `/health` | Cek server hidup |
| POST | `/register` | Buat akun, langsung mengembalikan token |
| POST | `/login` | Masuk, mengembalikan token (berlaku 24 jam) |
| GET | `/me` | Data akun yang sedang masuk |
| GET | `/notes` | Daftar catatan milik pengguna (yang disematkan di atas) |
| POST | `/notes` | Buat catatan: `title`, `content`, `color`, `pinned` |
| PUT | `/notes/:id` | Ubah catatan, boleh sebagian field saja |
| DELETE | `/notes/:id` | Hapus catatan |

Warna yang diizinkan: `sun`, `mint`, `sky`, `rose`, `lilac`, `peach`.

## Pengujian

```sh
cd backend && go test ./...     # password, token JWT, validasi, middleware, CORS, konfigurasi
cd frontend && npm test         # halaman masuk, papan catatan, editor, pencarian, hapus
```

## Struktur proyek

```
simple-notes/
├── backend/
│   ├── main.go          titik masuk server
│   ├── router.go        daftar rute
│   ├── handlers.go      logika endpoint
│   ├── auth.go          JWT dan bcrypt
│   ├── middleware.go    CORS dan pemeriksaan token
│   ├── validate.go      validasi input
│   ├── database.go      koneksi dan migrasi
│   ├── models.go        model User dan Note
│   └── config.go        pembacaan konfigurasi
├── frontend/
│   └── src/
│       ├── pages/       Login dan Board
│       ├── components/  NoteCard, NoteEditor, ikon
│       ├── hooks.js     pengelolaan data catatan
│       ├── auth.jsx     sesi login
│       └── api.js       klien Axios
├── docker-compose.yml   PostgreSQL untuk pengembangan
└── DEPLOY.md            panduan deploy ke hosting
```

## Deploy

Frontend dan backend dapat di-deploy terpisah. Langkah lengkap, contoh `render.yaml`, dan solusi masalah umum ada di [DEPLOY.md](DEPLOY.md).

## Catatan keamanan

- Password disimpan sebagai hash bcrypt dan tidak pernah dikirim kembali oleh API.
- Token login disimpan di `localStorage` browser dan berlaku 24 jam.
- Belum ada pembatasan percobaan login (rate limiting). Tambahkan sebelum dipakai untuk umum.
- Jangan commit file `.env`. Sudah diabaikan lewat `.gitignore`.
