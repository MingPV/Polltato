package usecase

import (
	"fmt"

	"os"

	"github.com/skip2/go-qrcode"
)

func GenerateQRCodeBytes(roomID string) ([]byte, string, error) {
	url := fmt.Sprintf("%s/room/%s", os.Getenv("FRONTEND_URL"), roomID)

	png, err := qrcode.Encode(url, qrcode.Medium, 256)
	if err != nil {
		return nil, "", err
	}

	key := fmt.Sprintf("qrcodes/%s.png", roomID)

	return png, key, nil
}
