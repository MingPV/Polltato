package routes

import (
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"

	// Order
	orderHandler "github.com/MingPV/Polltato/internal/order/handler/rest"
	orderRepository "github.com/MingPV/Polltato/internal/order/repository"
	orderUseCase "github.com/MingPV/Polltato/internal/order/usecase"

	// User
	userHandler "github.com/MingPV/Polltato/internal/user/handler/rest"
	userRepository "github.com/MingPV/Polltato/internal/user/repository"
	userUseCase "github.com/MingPV/Polltato/internal/user/usecase"
)

func RegisterPublicRoutes(app fiber.Router, db *gorm.DB) {

	api := app.Group("/api/v1")

	// === Dependency Wiring ===

	// Order
	orderRepo := orderRepository.NewGormOrderRepository(db)
	orderService := orderUseCase.NewOrderService(orderRepo)
	orderHandler := orderHandler.NewHttpOrderHandler(orderService)

	// User
	userRepo := userRepository.NewGormUserRepository(db)
	userService := userUseCase.NewUserService(userRepo)
	userHandler := userHandler.NewHttpUserHandler(userService)

	// === Public Routes ===

	// Auth routes (separated from /users)
	authGroup := api.Group("/auth")
	authGroup.Post("/signup", userHandler.Register)
	authGroup.Post("/signin", userHandler.Login)
	authGroup.Post("/signout", userHandler.Logout)

	// Order routes (leaving as public for now if you want, or I can move them too)
	orderGroup := api.Group("/orders")
	orderGroup.Get("/", orderHandler.FindAllOrders)
	orderGroup.Get("/:id", orderHandler.FindOrderByID)
	orderGroup.Post("/", orderHandler.CreateOrder)
	orderGroup.Patch("/:id", orderHandler.PatchOrder)
	orderGroup.Delete("/:id", orderHandler.DeleteOrder)
}
