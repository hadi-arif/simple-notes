package main

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
)

func testApp() *App {
	gin.SetMode(gin.TestMode)
	return &App{cfg: Config{
		JWTSecret:      []byte("rahasia-tes"),
		AllowedOrigins: []string{"http://localhost:3000"},
	}}
}

func do(r http.Handler, method, path, origin, auth string) *httptest.ResponseRecorder {
	req := httptest.NewRequest(method, path, nil)
	if origin != "" {
		req.Header.Set("Origin", origin)
	}
	if auth != "" {
		req.Header.Set("Authorization", auth)
	}
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	return w
}

func TestHealth(t *testing.T) {
	r := newRouter(testApp())
	if w := do(r, http.MethodGet, "/health", "", ""); w.Code != http.StatusOK {
		t.Errorf("status = %d", w.Code)
	}
}

func TestNotesRequireAuth(t *testing.T) {
	r := newRouter(testApp())
	for _, auth := range []string{"", "Bearer", "Bearer ngawur", "Basic abc"} {
		if w := do(r, http.MethodGet, "/notes", "", auth); w.Code != http.StatusUnauthorized {
			t.Errorf("auth %q: status = %d, ingin 401", auth, w.Code)
		}
	}
}

func TestAuthMiddlewareAcceptsValidToken(t *testing.T) {
	app := testApp()
	r := gin.New()
	r.GET("/ping", authRequired(app.cfg.JWTSecret), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"uid": c.GetUint("userID")})
	})
	token, _ := generateToken(app.cfg.JWTSecret, 42, "hadi", time.Hour)
	w := do(r, http.MethodGet, "/ping", "", "Bearer "+token)
	if w.Code != http.StatusOK {
		t.Fatalf("status = %d", w.Code)
	}
	if got := w.Body.String(); got != `{"uid":42}` {
		t.Errorf("body = %s", got)
	}
}

func TestCORS(t *testing.T) {
	r := newRouter(testApp())

	w := do(r, http.MethodOptions, "/notes", "http://localhost:3000", "")
	if w.Code != http.StatusNoContent {
		t.Errorf("preflight status = %d", w.Code)
	}
	if got := w.Header().Get("Access-Control-Allow-Origin"); got != "http://localhost:3000" {
		t.Errorf("origin yang diizinkan salah: %q", got)
	}

	w = do(r, http.MethodGet, "/health", "http://situs-asing.example", "")
	if got := w.Header().Get("Access-Control-Allow-Origin"); got != "" {
		t.Errorf("origin asing tidak boleh diizinkan, dapat %q", got)
	}
}
