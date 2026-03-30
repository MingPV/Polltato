package usecase

import (
	"bytes"
	"context"
	"errors"
	"log"

	"github.com/MingPV/Polltato/internal/entities"
	"github.com/MingPV/Polltato/internal/poll/dto"
	"github.com/MingPV/Polltato/internal/poll/repository"
	"github.com/MingPV/Polltato/internal/realtime"
	"github.com/MingPV/Polltato/pkg/apperror"
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

func (s *PollService) PatchPollByRoomID(roomID string, ctx context.Context, req *dto.PatchPollRequest) (*dto.PollResponse, error) {
	//0. get poll

	var poll *entities.Poll
	var err error

	err = s.db.Transaction(func(tx *gorm.DB) error {
		pollRepo := s.pollRepo.WithTx(tx)
		pollResultRepo := s.pollResultRepo.WithTx(tx)
		poll, err = pollRepo.FindByRoomID(roomID)
		if err != nil {
			return err
		}

		//1. check authorization in poll
		if poll.UserID != req.UserID {
			return errors.New("unauthorized")
		}

		//2. edit poll
		if req.PollName != "" {
			poll.PollName = req.PollName
		}
		if req.IsMulti != poll.IsMulti {
			poll.IsMulti = req.IsMulti
		}
		poll.Version = poll.Version + 1
		log.Println(poll)

		//3. update poll in database
		if err := pollRepo.PatchByID(poll.ID, poll); err != nil {
			return err
		}

		//4. add new poll results in database
		var newPollResults []*entities.PollResult

		if len(req.AddedChoices) > 0 {
			newPollResults = make([]*entities.PollResult, len(req.AddedChoices))
			for i, choice := range req.AddedChoices {
				newPollResults[i] = &entities.PollResult{
					RoomID:     roomID,
					ChoiceName: choice,
					NumberVote: 0,
				}
			}

			if err := pollResultRepo.Save(newPollResults); err != nil {
				return err
			}
		}

		//5. delete poll results in database
		if len(req.DeletedChoices) > 0 {
			if err := pollResultRepo.DeleteByManyID(req.DeletedChoices); err != nil {
				return err
			}
		}

		//6. resrt all poll results of room id to 0
		if err := pollResultRepo.ResetVote(roomID); err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	//7. get current poll results
	var pollResponse *entities.Poll
	pollResponse, err = s.pollRepo.FindByRoomID(roomID)
	if err != nil {
		return nil, err
	}

	url, _ := s.storage.GetURL(ctx, pollResponse.QRCodeImageKey)
	response := dto.ToPollResponse(pollResponse, url)

	// 8. Broadcast update
	if s.socketServer != nil {
		choices := make([]realtime.PollChoiceResponse, len(response.Choices))
		for i, c := range response.Choices {
			choices[i] = realtime.PollChoiceResponse{
				ID:         c.ID,
				ChoiceName: c.ChoiceName,
				NumberVote: c.NumberVote,
			}
		}

		event := realtime.PollUpdateEvent{
			From:    req.UserID.String(),
			RoomID:  roomID,
			Type:    realtime.PollTypeUpdatePoll,
			Version: int64(pollResponse.Version),
			Data: realtime.PollData{
				ID:         pollResponse.ID,
				PollName:   pollResponse.PollName,
				IsMulti:    pollResponse.IsMulti,
				RoomID:     pollResponse.RoomID,
				Choices:    choices,
				UpdateTime: pollResponse.UpdatedAt,
			},
		}
		realtime.BroadcastPollUpdate(s.socketServer, roomID, event)
	}

	return response, nil
}

func (s *PollService) Vote(ctx context.Context, roomID string, choiceIDs []int) (*dto.PollResponse, error) {

	err := s.db.Transaction(func(tx *gorm.DB) error {
		pollResultRepo := s.pollResultRepo.WithTx(tx)
		pollRepo := s.pollRepo.WithTx(tx)

		poll, err := pollRepo.FindByRoomID(roomID)
		if err != nil {
			return err
		}

		pollRepo.PatchByID(poll.ID, &entities.Poll{
			Version: poll.Version + 1,
		})

		return pollResultRepo.IncrementVote(roomID, choiceIDs)
	})

	if err != nil {
		return nil, err
	}

	// Retrieve updated data for return and broadcast
	poll, err := s.pollRepo.FindByRoomID(roomID)
	if err != nil {
		return nil, err
	}

	url, _ := s.storage.GetURL(ctx, poll.QRCodeImageKey)
	response := dto.ToPollResponse(poll, url)

	// Broadcast update
	if s.socketServer != nil {
		choices := make([]realtime.PollChoiceResponse, len(response.Choices))
		for i, c := range response.Choices {
			choices[i] = realtime.PollChoiceResponse{
				ID:         c.ID,
				ChoiceName: c.ChoiceName,
				NumberVote: c.NumberVote,
			}
		}

		event := realtime.PollUpdateEvent{
			From:    "participant",
			RoomID:  roomID,
			Type:    realtime.PollTypeUpdatePoll,
			Version: int64(poll.Version),
			Data: realtime.PollData{
				ID:         poll.ID,
				PollName:   poll.PollName,
				IsMulti:    poll.IsMulti,
				RoomID:     poll.RoomID,
				Choices:    choices,
				UpdateTime: poll.UpdatedAt,
			},
		}
		realtime.BroadcastPollUpdate(s.socketServer, roomID, event)
	}

	return response, nil
}

func (s *PollService) ResetPoll(ctx context.Context, roomID string, userID uuid.UUID) (*dto.PollResponse, error) {
	poll, err := s.pollRepo.FindByRoomID(roomID)
	if err != nil {
		return nil, err
	}

	if poll.UserID != userID {
		return nil, apperror.ErrUnauthorized
	}

	err = s.db.Transaction(func(tx *gorm.DB) error {
		pollResultRepo := s.pollResultRepo.WithTx(tx)
		pollRepo := s.pollRepo.WithTx(tx)

		if err := pollResultRepo.ResetVote(roomID); err != nil {
			return err
		}

		return pollRepo.PatchByID(poll.ID, &entities.Poll{
			Version: poll.Version + 1,
		})
	})

	if err != nil {
		return nil, err
	}

	// Retrieve updated data for return and broadcast
	updatedPoll, err := s.pollRepo.FindByRoomID(roomID)
	if err != nil {
		return nil, err
	}

	url, _ := s.storage.GetURL(ctx, updatedPoll.QRCodeImageKey)
	response := dto.ToPollResponse(updatedPoll, url)

	// Broadcast update
	if s.socketServer != nil {
		choices := make([]realtime.PollChoiceResponse, len(response.Choices))
		for i, c := range response.Choices {
			choices[i] = realtime.PollChoiceResponse{
				ID:         c.ID,
				ChoiceName: c.ChoiceName,
				NumberVote: c.NumberVote,
			}
		}

		event := realtime.PollUpdateEvent{
			From:    "owner",
			RoomID:  roomID,
			Type:    realtime.PollTypeResetPoll,
			Version: int64(updatedPoll.Version),
			Data: realtime.PollData{
				ID:         updatedPoll.ID,
				PollName:   updatedPoll.PollName,
				IsMulti:    updatedPoll.IsMulti,
				RoomID:     updatedPoll.RoomID,
				Choices:    choices,
				UpdateTime: updatedPoll.UpdatedAt,
			},
		}
		realtime.BroadcastPollUpdate(s.socketServer, roomID, event)
	}

	return response, nil
}
