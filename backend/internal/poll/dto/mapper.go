package dto

import "github.com/MingPV/Polltato/internal/entities"

func ToPollResponse(poll *entities.Poll, qrCodeURL string) *PollResponse {
	totalVotes := 0
	choices := make([]PollResultResponse, len(poll.PollResults))
	for i, r := range poll.PollResults {
		totalVotes += r.NumberVote
		choices[i] = PollResultResponse{
			ID:         r.ID,
			ChoiceName: r.ChoiceName,
			NumberVote: r.NumberVote,
		}
	}

	return &PollResponse{
		ID:         poll.ID,
		PollName:   poll.PollName,
		IsMulti:    poll.IsMulti,
		RoomID:     poll.RoomID,
		Version:    poll.Version,
		QRCodeURL:  qrCodeURL,
		Choices:    choices,
		TotalVotes: totalVotes,
		CreatedAt:  poll.CreatedAt,
		UpdatedAt:  poll.UpdatedAt,
	}
}
