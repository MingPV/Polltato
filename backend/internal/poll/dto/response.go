package dto

import (
	"time"
)

type PollResponse struct {
	ID         uint                 `json:"id"`
	PollName   string               `json:"poll_name"`
	IsMulti    bool                 `json:"is_multi"`
	RoomID     string               `json:"room_id"`
	QRCodeURL  string               `json:"qrcode_url"`
	Choices    []PollResultResponse `json:"choices"`
	TotalVotes int                  `json:"total_votes"`
	CreatedAt  time.Time            `json:"create_time"`
	UpdatedAt  time.Time            `json:"update_time"`
}

type PollResultResponse struct {
	ID         uint   `json:"id"`
	ChoiceName string `json:"choice_name"`
	NumberVote int    `json:"number_vote"`
}
