package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func newRouter(app *App) *gin.Engine {
	r := gin.Default()
	_ = r.SetTrustedProxies(nil)
	r.Use(cors(app.cfg.AllowedOrigins))

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})
	r.POST("/register", app.register)
	r.POST("/login", app.login)

	authed := r.Group("/", authRequired(app.cfg.JWTSecret))
	authed.GET("/me", app.me)
	authed.GET("/notes", app.listNotes)
	authed.POST("/notes", app.createNote)
	authed.PUT("/notes/:id", app.updateNote)
	authed.DELETE("/notes/:id", app.deleteNote)

	return r
}
