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
git clone https://github.com/hadi-arif/simple-notes.git
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

## ✅ Testing
Backend:
```sh
go test ./...
```
Frontend:
```sh
npm test
```
