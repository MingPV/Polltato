package entities

type PollResult struct {
	ID         uint   `gorm:"primaryKey;autoIncrement" json:"id"`
	ChoiceName string `json:"choice_name"`
	NumberVote int    `json:"number_vote"`
	RoomID     string `gorm:"not null"`
}
