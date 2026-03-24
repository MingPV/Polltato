package dto

import "github.com/MingPV/Polltato/internal/entities"

func ToPollResponse(poll *entities.Poll, qrCodeURL string) *PollResponse {
	choices := make([]PollResultResponse, len(poll.PollResults))
	for i, r := range poll.PollResults {
		choices[i] = PollResultResponse{
			ID:         r.ID,
			ChoiceName: r.ChoiceName,
			NumberVote: r.NumberVote,
		}
	}

	return &PollResponse{
		ID:                  poll.ID,
		PollName:            poll.PollName,
		IsMulti:             poll.IsMulti,
		AllowCustomerChoice: poll.AllowCustomerChoice,
		RoomID:              poll.RoomID,
		QRCodeURL:           qrCodeURL,
		Choices:             choices,
	}
}
