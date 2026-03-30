package usecase

import (
	"context"

	"github.com/MingPV/Polltato/internal/poll/dto"
	"github.com/google/uuid"
)

type PollUseCase interface {
	// FindAllPolls() ([]*entities.Poll, error)
	CreatePoll(ctx context.Context, poll *dto.CreatePollRequest) (*dto.PollResponse, error)
	GetPollByRoomID(ctx context.Context, roomID string) (*dto.PollResponse, error)
	PatchPollByRoomID(roomID string, ctx context.Context, req *dto.PatchPollRequest) (*dto.PollResponse, error)
	Vote(ctx context.Context, roomID string, choiceIDs []int) (*dto.PollResponse, error)
	ResetPoll(ctx context.Context, roomID string, userID uuid.UUID) (*dto.PollResponse, error)
}
