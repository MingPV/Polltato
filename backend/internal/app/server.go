package app

import (
	"io"
	"log"
	"time"

	"github.com/MingPV/Polltato/internal/realtime"
	"github.com/MingPV/Polltato/pkg/database"
	"github.com/MingPV/Polltato/pkg/storage"
	"github.com/MingPV/Polltato/utils"
)

func Start() {

	// Setup dependencies: database and configuration
	db, cfg, err := SetupDependencies("")
	if err != nil {
		log.Fatalf("❌ Failed to setup dependencies: %v", err)
	}

	// Setup S3 storage
	s3Storage, err := storage.NewS3Provider(
		cfg.S3Bucket,
		cfg.S3Region,
		cfg.S3KeyID,
		cfg.S3SecretKey,
		cfg.S3Endpoint,
	)
	if err != nil {
		log.Printf("⚠️ Failed to setup S3 storage: %v. Some features may not work.", err)
	}

	// Setup REST server
	restApp, err := SetupRestServer(db, cfg, s3Storage)
	if err != nil {
		log.Fatalf("❌ Failed to setup REST server: %v", err)
	}

	chatSocket := realtime.NewChatSocketServer()
	// go-socket.io only runs namespace handlers (OnConnect, OnEvent) from serveConn,
	// which is started by Server.Serve() reading engine sessions from connChan.
	// ServeHTTP alone handles Engine.IO polling responses but never consumes connChan.
	go func() {
		if err := chatSocket.Serve(); err != nil && err != io.EOF {
			log.Printf("Socket.IO Serve exited: %v", err)
		}
	}()

	// Start REST + Socket.IO (shared HTTP) and gRPC servers
	httpSrv := utils.StartRestServer(restApp, cfg, chatSocket)

	// Graceful shutdown listener
	utils.WaitForShutdown([]func(){
		func() {
			// Fast path: Close() drops the listener and active connections (including
			// Engine.IO long-polls). Graceful Shutdown can wait up to ~pingTimeout otherwise.
			// Brief sleep avoids racing engineio newSession sends onto a closed connChan.
			log.Println("Shutting down HTTP (REST + Socket.IO)...")
			if err := httpSrv.Close(); err != nil {
				log.Printf("HTTP Close: %v", err)
			}
			time.Sleep(150 * time.Millisecond)

			log.Println("Shutting down Socket.IO engine...")
			if err := chatSocket.Close(); err != nil {
				log.Printf("Error closing Socket.IO: %v", err)
			}
		},
		func() {
			if err := database.Close(); err != nil {
				log.Printf("Error closing DB: %v", err)
			}
		},
	})

}
