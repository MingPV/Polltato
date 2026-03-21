package utils

import (
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"

	"github.com/MingPV/Polltato/pkg/config"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/adaptor"
	socketio "github.com/googollee/go-socket.io"
	"google.golang.org/grpc"
)

// socketIOCORS writes headers for browser cross-origin Socket.IO (XHR + preflight).
func socketIOCORS(w http.ResponseWriter, r *http.Request) {
	raw := os.Getenv("CORS_ORIGIN")
	if raw == "" {
		raw = "http://localhost:3000"
	}
	primary := strings.TrimSpace(strings.Split(raw, ",")[0])
	w.Header().Set("Access-Control-Allow-Origin", primary)
	w.Header().Set("Access-Control-Allow-Credentials", "true")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	if req := r.Header.Get("Access-Control-Request-Headers"); req != "" {
		w.Header().Set("Access-Control-Allow-Headers", req)
	} else {
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Accept")
	}
}

// newHTTPRootHandler routes /socket.io* to Socket.IO and everything else to Fiber.
// Go 1.22+ ServeMux can send "/socket.io" (no trailing slash) to the "/" catch-all;
// the client sometimes uses that path, so we normalize here.
func newHTTPRootHandler(app *fiber.App, sio *socketio.Server) http.Handler {
	fiberH := adaptor.FiberApp(app)
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path
		if strings.HasPrefix(path, "/socket.io") {
			if r.Method == http.MethodOptions {
				socketIOCORS(w, r)
				w.WriteHeader(http.StatusNoContent)
				return
			}

			req := r
			if path == "/socket.io" {
				req = r.Clone(r.Context())
				u := *r.URL
				u.Path = "/socket.io/"
				req.URL = &u
			}

			sio.ServeHTTP(w, req)
			return
		}

		fiberH.ServeHTTP(w, r)
	})
}

// StartRestServer serves Fiber (REST) and Socket.IO on the same HTTP port.
func StartRestServer(app *fiber.App, cfg *config.Config, sio *socketio.Server) *http.Server {
	// Avoid deadlines on upgraded/hijacked Engine.IO connections (WS + long-poll).
	srv := &http.Server{
		Addr:    ":" + cfg.AppPort,
		Handler: newHTTPRootHandler(app, sio),
	}

	go func() {
		log.Println("Starting REST + Socket.IO server on port:", cfg.AppPort)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("HTTP server error: %v", err)
		}
	}()

	return srv
}

func StartGrpcServer(grpcServer *grpc.Server, cfg *config.Config) {
	log.Println("Starting gRPC server on port:", cfg.GrpcPort)
	lis, err := net.Listen("tcp", ":"+cfg.GrpcPort)
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}
	if err := grpcServer.Serve(lis); err != nil {
		log.Fatalf("gRPC server error: %v", err)
	}
}

func WaitForShutdown(cleanups []func()) {
	c := make(chan os.Signal, 1)
	signal.Notify(c, syscall.SIGINT, syscall.SIGTERM)

	<-c // Wait for signal
	log.Println("Shutting down...")

	for _, cleanup := range cleanups {
		cleanup()
	}

	log.Println("Shutdown complete.")
}
