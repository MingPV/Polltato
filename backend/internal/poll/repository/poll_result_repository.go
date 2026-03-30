package repository

import (
	"github.com/MingPV/Polltato/internal/entities"
	"gorm.io/gorm"
)

type PollResultRepository interface {
	Save(pollResults []*entities.PollResult) error
	FindByRoomID(roomID string) ([]*entities.PollResult, error)
	PatchByID(id int, pollResult *entities.PollResult) error
	PatchByRoomID(roomID string, pollResult *entities.PollResult) error
	DeleteByID(id int) error
	DeleteByManyID(ids []int) error
	ResetVote(roomID string) error
	WithTx(tx *gorm.DB) PollResultRepository
}
