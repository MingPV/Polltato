package repository

import (
	"github.com/MingPV/Polltato/internal/entities"
	"gorm.io/gorm"
)

type PollResultRepository interface {
	Save(pollResults []*entities.PollResult) error
	FindByRoomID(roomID string) ([]*entities.PollResult, error)
	Patch(id int, pollResult *entities.PollResult) error
	Delete(id int) error
	WithTx(tx *gorm.DB) PollResultRepository
}
