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

// // FindAllOrders godoc
// // @Summary Get all orders
// // @Tags orders
// // @Produce json
// // @Success 200 {array} entities.Order
// // @Router /orders [get]
// func (h *HttpOrderHandler) FindAllOrders(c *fiber.Ctx) error {
// 	orders, err := h.orderUseCase.FindAllOrders()
// 	if err != nil {
// 		return responses.Error(c, err)
// 	}

// 	return c.JSON(dto.ToOrderResponseList(orders))
// }

// // FindOrderByID godoc
// // @Summary Get order by ID
// // @Tags orders
// // @Produce json
// // @Param id path int true "Order ID"
// // @Success 200 {object} entities.Order
// // @Router /orders/{id} [get]
// func (h *HttpOrderHandler) FindOrderByID(c *fiber.Ctx) error {
// 	id := c.Params("id")
// 	orderID, err := strconv.Atoi(id)
// 	if err != nil {
// 		return responses.ErrorWithMessage(c, err, "invalid id")
// 	}

// 	order, err := h.orderUseCase.FindOrderByID(orderID)
// 	if err != nil {
// 		return responses.Error(c, err)
// 	}

// 	return c.JSON(dto.ToOrderResponse(order))
// }

// // PatchOrder godoc
// // @Summary Update an order partially
// // @Tags orders
// // @Accept json
// // @Produce json
// // @Param id path int true "Order ID"
// // @Param order body entities.Order true "Order update payload"
// // @Success 200 {object} entities.Order
// // @Router /orders/{id} [patch]
// func (h *HttpOrderHandler) PatchOrder(c *fiber.Ctx) error {
// 	id := c.Params("id")
// 	orderID, err := strconv.Atoi(id)
// 	if err != nil {
// 		return responses.ErrorWithMessage(c, err, "invalid id")
// 	}

// 	var req dto.CreateOrderRequest
// 	if err := c.BodyParser(&req); err != nil {
// 		return responses.ErrorWithMessage(c, err, "invalid request")
// 	}

// 	order := &entities.Order{Total: req.Total}

// 	msg, err := validatePatchOrder(order)
// 	if err != nil {
// 		return responses.ErrorWithMessage(c, err, msg)
// 	}

// 	updatedOrder, err := h.orderUseCase.PatchOrder(orderID, order)
// 	if err != nil {
// 		return responses.Error(c, err)
// 	}

// 	return c.JSON(dto.ToOrderResponse(updatedOrder))
// }

// // DeleteOrder godoc
// // @Summary Delete an order by ID
// // @Tags orders
// // @Produce json
// // @Param id path int true "Order ID"
// // @Success 200 {object} response.MessageResponse
// // @Router /orders/{id} [delete]
// func (h *HttpOrderHandler) DeleteOrder(c *fiber.Ctx) error {
// 	id := c.Params("id")
// 	orderID, err := strconv.Atoi(id)
// 	if err != nil {
// 		return responses.ErrorWithMessage(c, err, "invalid id")
// 	}

// 	if err := h.orderUseCase.DeleteOrder(orderID); err != nil {
// 		return responses.Error(c, err)
// 	}

// 	return responses.Message(c, fiber.StatusOK, "order deleted")
// }

// func validatePatchOrder(order *entities.Order) (string, error) {

// 	if order.Total <= 0 {
// 		return "total must be positive", apperror.ErrInvalidData
// 	}

// 	return "", nil
// }
