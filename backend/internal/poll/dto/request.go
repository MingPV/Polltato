package dto

import (
	"github.com/google/uuid"
)

type CreatePollRequest struct {
	PollName string    `json:"poll_name" validate:"required"`
	IsMulti  bool      `json:"is_multi"`
	Choices  []string  `json:"choices" validate:"required"`
	UserID   uuid.UUID `json:"-"`
}

type PatchPollRequest struct {
	PollName       string    `json:"poll_name"`
	IsMulti        bool      `json:"is_multi"`
	DeletedChoices []int     `json:"deleted_choices"`
	AddedChoices   []string  `json:"added_choices"`
	UserID         uuid.UUID `json:"-"`
}
