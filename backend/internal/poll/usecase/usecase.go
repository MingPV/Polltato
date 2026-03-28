package usecase

import (
	"bytes"
	"context"

	"github.com/MingPV/Polltato/internal/entities"
	"github.com/MingPV/Polltato/internal/poll/dto"
	"github.com/MingPV/Polltato/internal/poll/repository"
	"github.com/MingPV/Polltato/pkg/storage"
	"github.com/google/uuid"
	socketio "github.com/googollee/go-socket.io"
	"gorm.io/gorm"
)

// PollService
type PollService struct {
	pollRepo       repository.PollRepository
	pollResultRepo repository.PollResultRepository
	storage        storage.StorageProvider
	db             *gorm.DB
	socketServer   *socketio.Server
}

// Init OrderService function
func NewPollService(pollRepo repository.PollRepository, pollResultRepo repository.PollResultRepository, storage storage.StorageProvider, db *gorm.DB, socketServer *socketio.Server) PollUseCase {
	return &PollService{pollRepo: pollRepo, pollResultRepo: pollResultRepo, storage: storage, db: db, socketServer: socketServer}
}

// PollService Methods - 1 create
func (s *PollService) CreatePoll(ctx context.Context, req *dto.CreatePollRequest) (*dto.PollResponse, error) {
	roomID := uuid.New().String()

	// 1. Generate QR Code
	png, key, err := GenerateQRCodeBytes(roomID)
	if err != nil {
		return nil, err
	}

	// 2. Upload to Storage
	_, err = s.storage.Upload(ctx, key, bytes.NewReader(png), "image/png")
	if err != nil {
		return nil, err
	}

	// --- Manual Rollback for S3 ---
	success := false
	defer func() {
		if !success {
			_ = s.storage.Delete(ctx, key)
		}
	}()

	// 3. Database Transaction
	var poll entities.Poll
	var pollResults []*entities.PollResult

	err = s.db.Transaction(func(tx *gorm.DB) error {
		// Use transaction-scoped repositories
		pollRepo := s.pollRepo.WithTx(tx)
		pollResultRepo := s.pollResultRepo.WithTx(tx)

		poll = entities.Poll{
			PollName:       req.PollName,
			IsMulti:        req.IsMulti,
			RoomID:         roomID,
			UserID:         req.UserID,
			QRCodeImageKey: key,
			Version:        1,
		}

		if err := pollRepo.Save(&poll); err != nil {
			return err
		}

		pollResults = make([]*entities.PollResult, len(req.Choices))
		for i, choice := range req.Choices {
			pollResults[i] = &entities.PollResult{
				RoomID:     roomID,
				ChoiceName: choice,
				NumberVote: 0,
			}
		}

		if err := pollResultRepo.Save(pollResults); err != nil {
			return err
		}

		// Attach results to poll for the response DTO
		poll.PollResults = make([]entities.PollResult, len(pollResults))
		for i, res := range pollResults {
			poll.PollResults[i] = *res
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	// 4. Generate URL and convert to Response DTO
	url, _ := s.storage.GetURL(ctx, key)
	success = true
	return dto.ToPollResponse(&poll, url), nil
}

func (s *PollService) GetPollByRoomID(ctx context.Context, roomID string) (*dto.PollResponse, error) {
	poll, err := s.pollRepo.FindByRoomID(roomID)
	if err != nil {
		return nil, err
	}

	url, _ := s.storage.GetURL(ctx, poll.QRCodeImageKey)
	return dto.ToPollResponse(poll, url), nil
}
