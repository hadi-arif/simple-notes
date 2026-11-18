package main

import "time"

// User adalah pengguna aplikasi. Password disimpan sebagai hash bcrypt.
type User struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	Username     string    `gorm:"uniqueIndex;size:50;not null" json:"username"`
	PasswordHash string    `gorm:"not null;default:''" json:"-"`
	Notes        []Note    `gorm:"many2many:user_notes;" json:"-"`
	CreatedAt    time.Time `json:"created_at"`
}

// Note adalah satu catatan. Relasi ke User many-to-many lewat tabel user_notes.
type Note struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Title     string    `gorm:"size:200;not null;default:''" json:"title"`
	Content   string    `gorm:"type:text;not null;default:''" json:"content"`
	Color     string    `gorm:"size:20;not null;default:'sun'" json:"color"`
	Pinned    bool      `gorm:"not null;default:false" json:"pinned"`
	Users     []User    `gorm:"many2many:user_notes;" json:"-"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
