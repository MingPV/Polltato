package repository

import (
	"github.com/MingPV/Polltato/internal/entities"
	"gorm.io/gorm"
)

type PollResultRepository interface {
	Save(pollResults []*entities.PollResult) error
	FindByRoomID(roomID string) ([]*entities.PollResult, error)
	PatchByID(id int, roomID string, pollResult *entities.PollResult) error
	PatchByRoomID(roomID string, pollResult *entities.PollResult) error
	DeleteByID(id int, roomID string) error
	DeleteByManyID(roomID string, ids []int) error
	DeleteByRoomID(roomID string) error
	ResetVote(roomID string) error
	IncrementVote(roomID string, choiceIDs []int) error
	DecrementVote(roomID string, choiceIDs []int) error
	WithTx(tx *gorm.DB) PollResultRepository
}
