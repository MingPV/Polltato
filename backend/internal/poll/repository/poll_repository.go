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
	FindByID(id uint) (*entities.Poll, error)
	PatchByID(id uint, poll *entities.Poll) error
	DeleteByID(id uint) error
	DeleteByRoomID(roomID string) error
	WithTx(tx *gorm.DB) PollRepository
}
