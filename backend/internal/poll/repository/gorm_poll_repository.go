package repository

import (
	"github.com/MingPV/Polltato/internal/entities"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type GormPollRepository struct {
	db *gorm.DB
}

func NewGormPollRepository(db *gorm.DB) PollRepository {
	return &GormPollRepository{db: db}
}

func (r *GormPollRepository) Save(poll *entities.Poll) error {
	return r.db.Create(&poll).Error
}

func (r *GormPollRepository) FindAll() ([]*entities.Poll, error) {
	var pollValues []entities.Poll
	if err := r.db.Find(&pollValues).Error; err != nil {
		return nil, err
	}

	polls := make([]*entities.Poll, len(pollValues))
	for i := range pollValues {
		polls[i] = &pollValues[i]
	}
	return polls, nil
}

func (r *GormPollRepository) FindByRoomID(roomID string) (*entities.Poll, error) {
	var poll entities.Poll
	if err := r.db.Where("room_id = ?", roomID).First(&poll).Error; err != nil {
		return &entities.Poll{}, err
	}
	return &poll, nil
}

func (r *GormPollRepository) FindByUserID(userID uuid.UUID) ([]*entities.Poll, error) {
	var pollValues []entities.Poll
	if err := r.db.Where("user_id = ?", userID).Find(&pollValues).Error; err != nil {
		return nil, err
	}

	polls := make([]*entities.Poll, len(pollValues))
	for i := range pollValues {
		polls[i] = &pollValues[i]
	}
	return polls, nil
}

func (r *GormPollRepository) FindByID(id int) (*entities.Poll, error) {
	var poll entities.Poll
	if err := r.db.First(&poll, id).Error; err != nil {
		return &entities.Poll{}, err
	}
	return &poll, nil
}

func (r *GormPollRepository) Patch(id int, poll *entities.Poll) error {
	result := r.db.Model(&entities.Poll{}).Where("id = ?", id).Updates(poll)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *GormPollRepository) Delete(id int) error {
	result := r.db.Delete(&entities.Poll{}, id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *GormPollRepository) WithTx(tx *gorm.DB) PollRepository {
	return &GormPollRepository{db: tx}
}
