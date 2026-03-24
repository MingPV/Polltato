package dto

type PollResponse struct {
	ID                  uint                 `json:"id"`
	PollName            string               `json:"poll_name"`
	IsMulti             bool                 `json:"is_multi"`
	AllowCustomerChoice bool                 `json:"allow_customer_choice"`
	RoomID              string               `json:"room_id"`
	QRCodeURL           string               `json:"qrcode_url"`
	Choices             []PollResultResponse `json:"choices"`
}

type PollResultResponse struct {
	ID         uint   `json:"id"`
	ChoiceName string `json:"choice_name"`
	NumberVote int    `json:"number_vote"`
}
