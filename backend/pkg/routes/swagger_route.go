package routes

import (
	"github.com/gofiber/fiber/v2"

	"github.com/gofiber/contrib/swagger"
)

// SwaggerRoute func for describe group of API Docs routes.
func SwaggerRoute(a *fiber.App) {

	a.Use(swagger.New(swagger.Config{
		FilePath: "./docs/swagger.json",
		Path:     "docs",
	}))

}
