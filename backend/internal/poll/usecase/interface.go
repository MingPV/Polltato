package usecase

import (
	"context"

	"github.com/MingPV/Polltato/internal/poll/dto"
)

type PollUseCase interface {
	// FindAllPolls() ([]*entities.Poll, error)
	CreatePoll(ctx context.Context, poll *dto.CreatePollRequest) (*dto.PollResponse, error)
	GetPollByRoomID(ctx context.Context, roomID string) (*dto.PollResponse, error)
	PatchPollByRoomID(roomID string, ctx context.Context, req *dto.PatchPollRequest) (*dto.PollResponse, error)
	// DeletePoll(id int) error
	// FindPollByID(id int) (*entities.Poll, error)
	// FindPollByRoomID(roomID string) (*entities.Poll, error)
	// FindPollsByUserID(userID uuid.UUID) ([]*entities.Poll, error)
}
