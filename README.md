# Simple Notes

Simple Notes adalah aplikasi pencatatan harian berbasis web 

### Frontend:
- React
- Chakra UI
- React Router
- Axios

### Backend:
- Golang (Gin Framework)
- PostgreSQL (Relasi Many-to-Many)
- Gorm
- JWT Authentication

##  Cara Menjalankan
### 1. Clone Repository
```sh
git clone https://github.com/hadi-arif/notes-app.git
cd notes-app
```

### 2. Menjalankan Backend
```sh
cd backend
cp .env.example .env  # Konfigurasi database
go mod tidy
go run main.go
```

### 3. Menjalankan Frontend
```sh
cd frontend
npm install
npm start
```

## 🔑 Autentikasi
- Register dan Login dengan JWT
- Protected Routes di backend & frontend
- Role-based access control

## ✅ Testing
Backend:
```sh
go test ./...
```
Frontend:
```sh
npm test
```

## 📝 Dokumentasi API
Endpoint utama tersedia di `backend/docs/api.md`.

## 🎨 Tema dan Desain
- Warna utama: **Merah, Putih, Kuning** (tema sekolah)
- UI modern dengan Chakra UI

## 📌 Fitur Utama
- CRUD Notes (Create, Read, Update, Delete)
- User Authentication (JWT)
- Responsive UI
- Protected Routes
- API Error Handling
- Unit Testing (Backend & Frontend 90%+ coverage)

## 📢 Kontribusi
Pull request dipersilakan! Silakan buka issue untuk diskusi fitur atau bug.

## 📜 Lisensi
MIT License

