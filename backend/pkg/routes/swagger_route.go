package routes

import (
	"os"

	"github.com/gofiber/contrib/swagger"
	"github.com/gofiber/fiber/v2"
)

// SwaggerRoute func for describe group of API Docs routes.
func SwaggerRoute(a *fiber.App) {
	if _, err := os.Stat("./docs/swagger.json"); os.IsNotExist(err) {
		return // Skip swagger initialization if the file does not exist
	}

	a.Use(swagger.New(swagger.Config{
		FilePath: "./docs/swagger.json",
		Path:     "docs",
	}))
}
