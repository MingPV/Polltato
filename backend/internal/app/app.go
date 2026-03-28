package app

import (
	"github.com/gofiber/fiber/v2"
	"google.golang.org/grpc"
	"gorm.io/gorm"

	"github.com/MingPV/Polltato/internal/entities"
	GrpcOrderHandler "github.com/MingPV/Polltato/internal/order/handler/grpc"
	orderRepository "github.com/MingPV/Polltato/internal/order/repository"
	orderUseCase "github.com/MingPV/Polltato/internal/order/usecase"
	"github.com/MingPV/Polltato/pkg/config"
	"github.com/MingPV/Polltato/pkg/database"
	"github.com/MingPV/Polltato/pkg/middleware"
	"github.com/MingPV/Polltato/pkg/routes"
	"github.com/MingPV/Polltato/pkg/storage"
	orderpb "github.com/MingPV/Polltato/proto/order"
	socketio "github.com/googollee/go-socket.io"
)

// rest
func SetupRestServer(db *gorm.DB, cfg *config.Config, storage storage.StorageProvider, socketServer *socketio.Server) (*fiber.App, error) {
	app := fiber.New()
	middleware.FiberMiddleware(app)
	// comment out Swagger when testing
	routes.SwaggerRoute(app)
	routes.RegisterPublicRoutes(app, db, storage, socketServer)
	routes.RegisterPrivateRoutes(app, db, storage, socketServer)
	routes.RegisterNotFoundRoute(app)
	return app, nil
}

// grpc
func SetupGrpcServer(db *gorm.DB, cfg *config.Config) (*grpc.Server, error) {
	s := grpc.NewServer()
	orderRepo := orderRepository.NewGormOrderRepository(db)
	orderService := orderUseCase.NewOrderService(orderRepo)

	orderHandler := GrpcOrderHandler.NewGrpcOrderHandler(orderService)
	orderpb.RegisterOrderServiceServer(s, orderHandler)
	return s, nil
}

// dependencies
func SetupDependencies(env string) (*gorm.DB, *config.Config, error) {
	cfg := config.LoadConfig(env)

	db, err := database.Connect(cfg.DatabaseDSN)
	if err != nil {
		return nil, nil, err
	}

	if env == "test" { // Re-migrating once to fix schema issues
		_ = db.Migrator().DropTable(&entities.Order{}, &entities.User{}, &entities.Poll{}, &entities.PollResult{})
	}

	if err := db.AutoMigrate(&entities.User{}, &entities.Poll{}, &entities.Order{}, &entities.PollResult{}); err != nil {
		return nil, nil, err
	}

	return db, cfg, nil
}
