package storage

import (
	"context"
	"io"
)

type StorageProvider interface {
	Upload(ctx context.Context, key string, body io.Reader, contentType string) (string, error)
	GetURL(ctx context.Context, key string) (string, error)
	Delete(ctx context.Context, key string) error
}
