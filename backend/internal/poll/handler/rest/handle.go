package rest

import (
	"log"

	"github.com/MingPV/Polltato/internal/poll/dto"
	"github.com/MingPV/Polltato/internal/poll/usecase"
	"github.com/MingPV/Polltato/pkg/apperror"
	responses "github.com/MingPV/Polltato/pkg/responses"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type HttpPollHandler struct {
	pollUseCase usecase.PollUseCase
}

func NewHttpPollHandler(useCase usecase.PollUseCase) *HttpPollHandler {
	return &HttpPollHandler{pollUseCase: useCase}
}

// Vote godoc
// @Summary Vote on a poll choices
// @Description Vote on one or more choices in a specific poll room
// @Tags polls
// @Accept json
// @Produce json
// @Param room_id path string true "Room ID"
// @Param vote body dto.VoteRequest true "Vote payload"
// @Success 200 {object} responses.DataResponse{data=dto.PollResponse}
// @Router /polls/{room_id}/votes [post]
func (h *HttpPollHandler) Vote(c *fiber.Ctx) error {
	var req dto.VoteRequest
	roomID := c.Params("room_id")

	if roomID == "" {
		return responses.ErrorWithMessage(c, apperror.ErrInvalidData, "invalid room id")
	}

	if err := c.BodyParser(&req); err != nil {
		return responses.ErrorWithMessage(c, err, "invalid request body")
	}

	response, err := h.pollUseCase.Vote(c.Context(), roomID, req.ChoiceIDs)
	if err != nil {
		return responses.Error(c, err)
	}

	return responses.SuccessWithData(c, "success", response)
}

// CreatePoll godoc
// @Summary Create a new poll
// @Tags polls
// @Accept json
// @Produce json
// @Param poll body dto.CreatePollRequest true "Poll payload"
// @Success 201 {object} dto.PollResponse
// @Router /polls [post]
func (h *HttpPollHandler) CreatePoll(c *fiber.Ctx) error {
	var req dto.CreatePollRequest

	if err := c.BodyParser(&req); err != nil {
		log.Printf("❌ BodyParser error: %v", err)
		return responses.ErrorWithMessage(c, err, "invalid request")
	}

	// 1. Get and Parse UserID
	uidLocal := c.Locals("user_id")
	if uidLocal == nil {
		return responses.Error(c, apperror.ErrInvalidData)
	}

	uid, err := uuid.Parse(uidLocal.(string))
	if err != nil {
		return responses.ErrorWithMessage(c, err, "invalid user id")
	}
	req.UserID = uid

	// 2. Call UseCase
	response, err := h.pollUseCase.CreatePoll(c.Context(), &req)
	if err != nil {
		return responses.Error(c, err)
	}

	// 3. Return created poll (already a DTO)
	return c.Status(fiber.StatusCreated).JSON(response)
}

// GetPollByRoomID godoc
// @Summary Get poll by Room ID
// @Tags polls
// @Produce json
// @Param room_id path string true "Room ID"
// @Success 200 {object} responses.DataResponse
// @Router /polls/{room_id} [get]
func (h *HttpPollHandler) GetPollByRoomID(c *fiber.Ctx) error {
	roomID := c.Params("room_id")
	if roomID == "" {
		return responses.ErrorWithMessage(c, apperror.ErrInvalidData, "invalid room id")
	}

	response, err := h.pollUseCase.GetPollByRoomID(c.Context(), roomID)
	if err != nil {
		return responses.Error(c, err)
	}

	return responses.SuccessWithData(c, "success", response)
}

// PatchPoll godoc
// @Summary Patch poll
// @Tags polls
// @Accept json
// @Produce json
// @Param room_id path string true "Room ID"
// @Param poll body dto.PatchPollRequest true "Poll payload"
// @Success 200 {object} dto.PollResponse
// @Router /polls/{room_id} [patch]
func (h *HttpPollHandler) PatchPoll(c *fiber.Ctx) error {
	var req dto.PatchPollRequest

	roomID := c.Params("room_id")
	if roomID == "" {
		return responses.ErrorWithMessage(c, apperror.ErrInvalidData, "invalid room id")
	}

	if err := c.BodyParser(&req); err != nil {
		log.Printf("❌ BodyParser error: %v", err)
		return responses.ErrorWithMessage(c, err, "invalid request")
	}

	// 1. Get and Parse UserID
	uidLocal := c.Locals("user_id")
	if uidLocal == nil {
		return responses.Error(c, apperror.ErrInvalidData)
	}

	uid, err := uuid.Parse(uidLocal.(string))
	if err != nil {
		return responses.ErrorWithMessage(c, err, "invalid user id")
	}
	req.UserID = uid

	// 2. Call UseCase
	response, err := h.pollUseCase.PatchPollByRoomID(roomID, c.Context(), &req)
	if err != nil {
		return responses.Error(c, err)
	}

	// 3. Return updated poll (already a DTO)
	return responses.SuccessWithData(c, "success", response)
}

// ResetPoll godoc
// @Summary Reset poll results
// @Description Reset all vote counts to 0 for a specific poll. Only the owner can perform this.
// @Tags polls
// @Produce json
// @Param room_id path string true "Room ID"
// @Success 200 {object} dto.PollResponse
// @Router /polls/{room_id}/reset [post]
func (h *HttpPollHandler) ResetPoll(c *fiber.Ctx) error {
	roomID := c.Params("room_id")
	if roomID == "" {
		return responses.ErrorWithMessage(c, apperror.ErrInvalidData, "invalid room id")
	}

	// 1. Get and Parse UserID
	uidLocal := c.Locals("user_id")
	if uidLocal == nil {
		return responses.Error(c, apperror.ErrInvalidData)
	}

	uid, err := uuid.Parse(uidLocal.(string))
	if err != nil {
		return responses.ErrorWithMessage(c, err, "invalid user id")
	}

	// 2. Call UseCase
	response, err := h.pollUseCase.ResetPoll(c.Context(), roomID, uid)
	if err != nil {
		return responses.Error(c, err)
	}

	return responses.SuccessWithData(c, "success", response)
}
