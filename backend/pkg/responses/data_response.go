package responses

import "github.com/gofiber/fiber/v2"

// DataResponse represents a standard success response with a data object
type DataResponse struct {
	Message string      `json:"message" example:"success"`
	Data    interface{} `json:"data"`
}

func SuccessWithData(c *fiber.Ctx, message string, data interface{}) error {
	return c.Status(fiber.StatusOK).JSON(DataResponse{
		Message: message,
		Data:    data,
	})
}
