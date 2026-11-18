package main

import (
	"errors"
	"log"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// App menyimpan dependensi yang dipakai semua handler.
type App struct {
	db  *gorm.DB
	cfg Config
}

type credentials struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func badRequest(c *gin.Context, msg string) {
	c.JSON(http.StatusBadRequest, gin.H{"error": msg})
}

func serverError(c *gin.Context, err error) {
	log.Printf("error: %v", err)
	c.JSON(http.StatusInternalServerError, gin.H{"error": "Terjadi kesalahan di server"})
}

func (a *App) respondWithToken(c *gin.Context, status int, user User) {
	token, err := generateToken(a.cfg.JWTSecret, user.ID, user.Username, tokenLifetime)
	if err != nil {
		serverError(c, err)
		return
	}
	c.JSON(status, gin.H{"token": token, "user": user})
}

func (a *App) register(c *gin.Context) {
	var req credentials
	if err := c.ShouldBindJSON(&req); err != nil {
		badRequest(c, "Data yang dikirim tidak valid")
		return
	}
	username := normalizeUsername(req.Username)
	if err := validateCredentials(username, req.Password); err != nil {
		badRequest(c, err.Error())
		return
	}

	var count int64
	if err := a.db.Model(&User{}).Where("username = ?", username).Count(&count).Error; err != nil {
		serverError(c, err)
		return
	}
	if count > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "Username sudah dipakai, coba yang lain"})
		return
	}

	hash, err := hashPassword(req.Password)
	if err != nil {
		serverError(c, err)
		return
	}
	user := User{Username: username, PasswordHash: hash}
	if err := a.db.Create(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrDuplicatedKey) {
			c.JSON(http.StatusConflict, gin.H{"error": "Username sudah dipakai, coba yang lain"})
			return
		}
		serverError(c, err)
		return
	}
	a.respondWithToken(c, http.StatusCreated, user)
}

func (a *App) login(c *gin.Context) {
	var req credentials
	if err := c.ShouldBindJSON(&req); err != nil {
		badRequest(c, "Data yang dikirim tidak valid")
		return
	}
	username := normalizeUsername(req.Username)

	var user User
	err := a.db.Where("username = ?", username).First(&user).Error
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		serverError(c, err)
		return
	}
	if err != nil || !checkPassword(user.PasswordHash, req.Password) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Username atau password salah"})
		return
	}
	a.respondWithToken(c, http.StatusOK, user)
}

func (a *App) me(c *gin.Context) {
	var user User
	if err := a.db.First(&user, c.GetUint("userID")).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Akun tidak ditemukan, silakan masuk lagi"})
		return
	}
	c.JSON(http.StatusOK, user)
}

// findOwnedNote mencari catatan milik pengguna lewat tabel penghubung user_notes.
func (a *App) findOwnedNote(c *gin.Context, tx *gorm.DB) (Note, bool) {
	var note Note
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		badRequest(c, "ID catatan tidak valid")
		return note, false
	}
	err = tx.Joins("JOIN user_notes ON user_notes.note_id = notes.id").
		Where("user_notes.user_id = ? AND notes.id = ?", c.GetUint("userID"), id).
		First(&note).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		c.JSON(http.StatusNotFound, gin.H{"error": "Catatan tidak ditemukan"})
		return note, false
	}
	if err != nil {
		serverError(c, err)
		return note, false
	}
	return note, true
}

func (a *App) listNotes(c *gin.Context) {
	notes := []Note{}
	err := a.db.Joins("JOIN user_notes ON user_notes.note_id = notes.id").
		Where("user_notes.user_id = ?", c.GetUint("userID")).
		Order("notes.pinned DESC, notes.updated_at DESC").
		Find(&notes).Error
	if err != nil {
		serverError(c, err)
		return
	}
	c.JSON(http.StatusOK, notes)
}

func (a *App) createNote(c *gin.Context) {
	var in noteInput
	if err := c.ShouldBindJSON(&in); err != nil {
		badRequest(c, "Data yang dikirim tidak valid")
		return
	}
	note := Note{Color: "sun"}
	if err := applyNoteInput(&note, in); err != nil {
		badRequest(c, err.Error())
		return
	}

	userID := c.GetUint("userID")
	err := a.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&note).Error; err != nil {
			return err
		}
		return tx.Exec("INSERT INTO user_notes (user_id, note_id) VALUES (?, ?)", userID, note.ID).Error
	})
	if err != nil {
		serverError(c, err)
		return
	}
	c.JSON(http.StatusCreated, note)
}

func (a *App) updateNote(c *gin.Context) {
	var in noteInput
	if err := c.ShouldBindJSON(&in); err != nil {
		badRequest(c, "Data yang dikirim tidak valid")
		return
	}
	note, ok := a.findOwnedNote(c, a.db)
	if !ok {
		return
	}
	if err := applyNoteInput(&note, in); err != nil {
		badRequest(c, err.Error())
		return
	}
	if err := a.db.Save(&note).Error; err != nil {
		serverError(c, err)
		return
	}
	c.JSON(http.StatusOK, note)
}

func (a *App) deleteNote(c *gin.Context) {
	note, ok := a.findOwnedNote(c, a.db)
	if !ok {
		return
	}
	userID := c.GetUint("userID")
	err := a.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Exec("DELETE FROM user_notes WHERE user_id = ? AND note_id = ?", userID, note.ID).Error; err != nil {
			return err
		}
		var remaining int64
		if err := tx.Table("user_notes").Where("note_id = ?", note.ID).Count(&remaining).Error; err != nil {
			return err
		}
		if remaining == 0 {
			return tx.Delete(&Note{}, note.ID).Error
		}
		return nil
	})
	if err != nil {
		serverError(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}
