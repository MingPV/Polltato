package middleware

import (
	"os"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
)

// LoadCommon sets common global middleware for the app
func FiberMiddleware(app *fiber.App) {
	origin := os.Getenv("CORS_ORIGIN")
	if origin == "" {
		origin = "http://localhost:3000"
	}
	origins := strings.Split(origin, ",")
	for i := range origins {
		origins[i] = strings.TrimSpace(origins[i])
	}

	app.Use(

		logger.New(), // Logs all requests

		cors.New(cors.Config{
			AllowOrigins:     strings.Join(origins, ","),
			AllowCredentials: true,
			AllowHeaders:     "Origin, Content-Type, Accept, Authorization, Cookie",
			AllowMethods:     "GET,POST,PUT,PATCH,DELETE,OPTIONS",
		}),
	)
}
