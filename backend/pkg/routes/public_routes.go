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

	// Poll
	pollHandler "github.com/MingPV/Polltato/internal/poll/handler/rest"
	pollRepository "github.com/MingPV/Polltato/internal/poll/repository"
	pollUseCase "github.com/MingPV/Polltato/internal/poll/usecase"
	"github.com/MingPV/Polltato/pkg/storage"
	socketio "github.com/googollee/go-socket.io"
)

func RegisterPublicRoutes(app fiber.Router, db *gorm.DB, storage storage.StorageProvider, socketServer *socketio.Server) {

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

	// Poll
	pollRepo := pollRepository.NewGormPollRepository(db)
	pollResultRepo := pollRepository.NewGormPollResultRepository(db)
	pollService := pollUseCase.NewPollService(pollRepo, pollResultRepo, storage, db, socketServer)
	pollHandler := pollHandler.NewHttpPollHandler(pollService)

	// === Public Routes ===

	// Auth routes (separated from /users)
	authGroup := api.Group("/auth")
	authGroup.Post("/signup", userHandler.Register)
	authGroup.Post("/signin", userHandler.Login)
	authGroup.Post("/signout", userHandler.Logout)

	// Poll routes (Public)
	pollGroup := api.Group("/polls")
	pollGroup.Get("/:room_id", pollHandler.GetPollByRoomID)

	// Order routes (leaving as public for now if you want, or I can move them too)
	orderGroup := api.Group("/orders")
	orderGroup.Get("/", orderHandler.FindAllOrders)
	orderGroup.Get("/:id", orderHandler.FindOrderByID)
	orderGroup.Post("/", orderHandler.CreateOrder)
	orderGroup.Patch("/:id", orderHandler.PatchOrder)
	orderGroup.Delete("/:id", orderHandler.DeleteOrder)
}
