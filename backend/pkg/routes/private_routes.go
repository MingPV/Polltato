package routes

import (
	userHandler "github.com/MingPV/Polltato/internal/user/handler/rest"
	userRepository "github.com/MingPV/Polltato/internal/user/repository"
	userUseCase "github.com/MingPV/Polltato/internal/user/usecase"
	middleware "github.com/MingPV/Polltato/pkg/middleware"

	// Poll
	pollHandler "github.com/MingPV/Polltato/internal/poll/handler/rest"
	pollRepository "github.com/MingPV/Polltato/internal/poll/repository"
	pollUseCase "github.com/MingPV/Polltato/internal/poll/usecase"
	"github.com/MingPV/Polltato/pkg/storage"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

func RegisterPrivateRoutes(app fiber.Router, db *gorm.DB, storage storage.StorageProvider) {

	route := app.Group("/api/v1", middleware.JWTMiddleware())

	userRepo := userRepository.NewGormUserRepository(db)
	userService := userUseCase.NewUserService(userRepo)
	userHandler := userHandler.NewHttpUserHandler(userService)

	// Poll
	pollRepo := pollRepository.NewGormPollRepository(db)
	pollResultRepo := pollRepository.NewGormPollResultRepository(db)
	pollService := pollUseCase.NewPollService(pollRepo, pollResultRepo, storage, db)
	pollHandler := pollHandler.NewHttpPollHandler(pollService)

	// Users
	userGroup := route.Group("/users")
	userGroup.Get("/me", userHandler.GetUser)
	userGroup.Get("/", userHandler.FindAllUsers)
	// Specific routes before generic :id
	userGroup.Get("/:id", userHandler.FindUserByID)
	userGroup.Patch("/:id", userHandler.PatchUser)
	userGroup.Delete("/:id", userHandler.DeleteUser)

	// Poll
	route.Post("/polls", pollHandler.CreatePoll)
}
