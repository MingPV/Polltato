package repository

import (
	"github.com/MingPV/Polltato/internal/entities"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PollRepository interface {
	Save(poll *entities.Poll) error
	FindAll() ([]*entities.Poll, error)
	FindByRoomID(roomID string) (*entities.Poll, error)
	FindByUserID(userID uuid.UUID) ([]*entities.Poll, error)
	FindByID(id int) (*entities.Poll, error)
	Patch(id int, poll *entities.Poll) error
	Delete(id int) error
	WithTx(tx *gorm.DB) PollRepository
}
