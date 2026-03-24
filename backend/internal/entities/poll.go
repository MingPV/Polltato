package entities

import (
	"time"

	"github.com/google/uuid"
)

type Poll struct {
	ID                  uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	PollName            string    `json:"poll_name"`
	IsMulti             bool      `json:"is_multi"`
	AllowCustomerChoice bool      `json:"allow_customer_choice"`
	RoomID              string    `gorm:"unique;not null" json:"room_id"`
	UserID              uuid.UUID `gorm:"type:uuid"`
	QRCodeImageKey      string    `json:"qrcode_image_key"`
	Version             int       `json:"version"`
	CreatedAt           time.Time
	UpdatedAt           time.Time

	User        User         `gorm:"foreignKey:UserID"`
	PollResults []PollResult `gorm:"foreignKey:RoomID;references:RoomID;constraint:OnDelete:CASCADE"`
}
