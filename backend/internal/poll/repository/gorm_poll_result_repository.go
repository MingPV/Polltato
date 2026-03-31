package repository

import (
	"github.com/MingPV/Polltato/internal/entities"
	"gorm.io/gorm"
)

type GormPollResultRepository struct {
	db *gorm.DB
}

func NewGormPollResultRepository(db *gorm.DB) PollResultRepository {
	return &GormPollResultRepository{db: db}
}

func (r *GormPollResultRepository) Save(pollResults []*entities.PollResult) error {
	return r.db.Create(pollResults).Error
}

func (r *GormPollResultRepository) FindByRoomID(roomID string) ([]*entities.PollResult, error) {
	var pollResults []*entities.PollResult
	if err := r.db.Where("room_id = ?", roomID).Find(&pollResults).Error; err != nil {
		return []*entities.PollResult{}, err
	}
	return pollResults, nil
}

func (r *GormPollResultRepository) DeleteByID(id int, roomID string) error {
	result := r.db.Where("id = ? AND room_id = ?", id, roomID).Delete(&entities.PollResult{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *GormPollResultRepository) DeleteByManyID(roomID string, ids []int) error {
	result := r.db.Where("id IN ? AND room_id = ?", ids, roomID).Delete(&entities.PollResult{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *GormPollResultRepository) DeleteByRoomID(roomID string) error {
	result := r.db.Where("room_id = ?", roomID).Delete(&entities.PollResult{})
	if result.Error != nil {
		return result.Error
	}
	return nil
}

func (r *GormPollResultRepository) PatchByID(id int, roomID string, pollResult *entities.PollResult) error {
	result := r.db.Model(&entities.PollResult{}).Where("id = ? AND room_id = ?", id, roomID).Updates(pollResult)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *GormPollResultRepository) PatchByRoomID(roomID string, pollResult *entities.PollResult) error {
	result := r.db.Model(&entities.PollResult{}).Where("room_id = ?", roomID).Updates(pollResult)
	if result.Error != nil {
		return result.Error
	}
	return nil
}

func (r *GormPollResultRepository) ResetVote(roomID string) error {
	result := r.db.Model(&entities.PollResult{}).Where("room_id = ?", roomID).Update("number_vote", 0)
	if result.Error != nil {
		return result.Error
	}
	return nil
}

func (r *GormPollResultRepository) IncrementVote(roomID string, choiceIDs []int) error {
	result := r.db.Model(&entities.PollResult{}).Where("id IN ? AND room_id = ?", choiceIDs, roomID).Update("number_vote", gorm.Expr("number_vote + ?", 1))
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *GormPollResultRepository) DecrementVote(roomID string, choiceIDs []int) error {
	// ป้องกันไม่ให้คะแนนติดลบ
	result := r.db.Model(&entities.PollResult{}).
		Where("id IN ? AND room_id = ? AND number_vote > 0", choiceIDs, roomID).
		Update("number_vote", gorm.Expr("number_vote - ?", 1))

	if result.Error != nil {
		return result.Error
	}
	return nil
}

func (r *GormPollResultRepository) WithTx(tx *gorm.DB) PollResultRepository {
	return &GormPollResultRepository{db: tx}
}
