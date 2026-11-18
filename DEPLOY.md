# Panduan Deploy

Simple Notes di-deploy sebagai tiga bagian terpisah:

| Bagian | Isi | Contoh layanan |
| --- | --- | --- |
| Database | PostgreSQL | Render Postgres, Neon, Supabase, Railway |
| Backend | Go, dibuild dari `backend/Dockerfile` | Render, Railway, Fly.io |
| Frontend | Hasil `npm run build` (folder `dist/`) | Render Static Site, Vercel, Netlify, Cloudflare Pages |

Syarat awal: proyek ini sudah ada di repositori GitHub milikmu, dan file `.env` **tidak** ikut ter-commit (sudah ada di `.gitignore`).

## Urutan yang benar

Backend butuh alamat frontend (untuk CORS), dan frontend butuh alamat backend. Karena itu urutannya:

1. Buat database dan ambil connection string-nya.
2. Deploy backend dengan `ALLOWED_ORIGINS` sementara, lalu catat alamat backend.
3. Deploy frontend dengan `VITE_API_URL` berisi alamat backend, lalu catat alamat frontend.
4. Kembali ke backend, ganti `ALLOWED_ORIGINS` dengan alamat frontend, dan restart.

## Jalur cepat: Render Blueprint

File `render.yaml` di akar proyek membuat database, backend, dan frontend sekaligus.

1. Di dashboard Render pilih **New**, lalu **Blueprint**, dan hubungkan repositori ini.
2. Saat diminta nilai env, isi sementara `ALLOWED_ORIGINS` dengan `http://localhost:3000` dan `VITE_API_URL` dengan `https://contoh.onrender.com`. Nilai sebenarnya diganti di langkah berikutnya.
3. Setelah semua layanan terbit, salin alamat `notes-api` (misalnya `https://notes-api-xxxx.onrender.com`).
4. Buka layanan `notes-web`, ubah `VITE_API_URL` menjadi alamat itu, lalu **Manual Deploy** supaya frontend dibuild ulang.
5. Salin alamat `notes-web`, buka layanan `notes-api`, ubah `ALLOWED_ORIGINS` menjadi alamat itu (tanpa garis miring di akhir), lalu simpan. Layanan akan restart sendiri.

`JWT_SECRET` dibuat otomatis oleh Render, dan `DATABASE_URL` diambil dari database yang dibuat Blueprint.

## Jalur manual (penyedia mana pun)

### 1. Database

Buat database PostgreSQL di penyedia pilihanmu dan salin connection string-nya, bentuknya `postgres://user:password@host:5432/nama_db?sslmode=require`. Database harus sudah ada: server tidak membuatnya sendiri saat memakai `DATABASE_URL`. Tabel dibuat otomatis saat server pertama kali menyala.

### 2. Backend

Buat layanan web dari repositori, dengan:

- Root directory: `backend`
- Runtime: Docker (memakai `backend/Dockerfile`)
- Health check path: `/health`

Isi environment variable:

| Nama | Nilai |
| --- | --- |
| `DATABASE_URL` | connection string dari langkah 1 |
| `JWT_SECRET` | teks acak panjang, buat dengan `openssl rand -hex 32` |
| `ALLOWED_ORIGINS` | alamat frontend, misalnya `https://notes.vercel.app` (boleh beberapa, pisahkan koma) |
| `PORT` | biasanya diisi otomatis oleh layanan hosting |

`GIN_MODE=release` sudah diatur di Dockerfile. Di mode ini server menolak berjalan kalau `JWT_SECRET` kosong. Kalau database mewajibkan SSL tapi tidak memakai `DATABASE_URL`, isi `DB_SSLMODE=require`.

Cek backend dengan membuka `https://alamat-backend/health`, harusnya muncul `{"status":"ok"}`.

### 3. Frontend

Buat proyek dari repositori yang sama dengan:

- Root directory: `frontend` (di Netlify namanya **Base directory**)
- Build command: `npm run build`
- Output directory: `dist` (di Netlify namanya **Publish directory**, relatif terhadap Base directory)
- Environment variable: `VITE_API_URL` = alamat backend (tanpa garis miring di akhir)
- Node.js 20.19 atau lebih baru (`frontend/.node-version` meminta Node 22)

Pengalihan semua alamat ke `index.html` sudah disediakan untuk Vercel (`frontend/vercel.json`), Netlify (`netlify.toml` di akar repositori dan `frontend/public/_redirects`), dan Render (`render.yaml`). Di Cloudflare Pages, situs tanpa file `404.html` otomatis diperlakukan sebagai aplikasi satu halaman.

## Kalau ada masalah

- **Muncul error CORS di konsol browser.** `ALLOWED_ORIGINS` tidak sama persis dengan alamat frontend. Periksa `https` atau `http`, subdomain, dan jangan ada garis miring di akhir. Setelah mengubahnya, backend harus restart.
- **"Server tidak bisa dihubungi. Pastikan backend berjalan di http://localhost:8080".** Alamat `localhost` di pesan itu berarti `VITE_API_URL` tidak terbaca saat build. Isi variabel itu di pengaturan hosting frontend (di Netlify: Environment variables, cakupan **Builds**), lalu **Clear cache and deploy site**. Backend juga harus sudah terbit lebih dulu.
- **"Server tidak bisa dihubungi" dengan alamat backend yang benar.** Ada dua kemungkinan. Di paket gratis, backend yang lama tidak dipakai bisa butuh sekitar satu menit untuk bangun, jadi coba lagi. Atau `VITE_API_URL` salah: nilainya ikut tertanam saat build, jadi setelah diperbaiki frontend harus dibuild ulang.
- **Backend gagal start dengan pesan soal database.** Periksa `DATABASE_URL`. Kalau pesannya menyinggung SSL, tambahkan `?sslmode=require` di ujung URL.
- **Backend berhenti dengan pesan `JWT_SECRET wajib diisi`.** Isi variabel itu di pengaturan layanan.
- **Halaman 404 saat di-refresh.** Pengalihan ke `index.html` belum aktif di hosting frontendmu. Cek file konfigurasi yang sesuai di atas.
- **Netlify menampilkan "Page not found" di semua alamat, termasuk halaman utama.** Biasanya Base directory belum diisi `frontend`. Netlify lalu membuild dari akar repositori yang tidak punya `package.json`, sehingga tidak ada `index.html` yang diterbitkan. Isi Base directory `frontend`, Build command `npm run build`, Publish directory `dist` di Project configuration, Build & deploy, Build settings, lalu jalankan **Clear cache and deploy site**. Di log deploy harus terlihat `npm run build` dijalankan.
- **Login lama tidak bisa dipakai setelah ganti `JWT_SECRET`.** Itu wajar. Semua token lama jadi tidak valid, dan pengguna cukup masuk lagi.

## Batasan yang perlu diketahui

- Paket gratis biasanya punya batas (server tidur, database bisa kedaluwarsa atau dibatasi). Cek aturan terbaru di situs masing-masing penyedia, dan jangan menyimpan catatan penting di database gratis tanpa cadangan.
- Belum ada pembatasan percobaan login (rate limiting), jadi kalau aplikasi dipakai publik, pertimbangkan menambahkannya.
- Token login disimpan di `localStorage` browser dan berlaku 24 jam.
