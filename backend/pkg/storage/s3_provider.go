package storage

import (
	"context"
	"fmt"
	"io"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

type S3Provider struct {
	client        *s3.Client
	presignClient *s3.PresignClient
	bucket        string
	region        string
}

func NewS3Provider(bucket, region, keyID, secretKey, endpoint string) (*S3Provider, error) {
	var cfg aws.Config
	var err error

	if keyID != "" && secretKey != "" {
		cfg, err = config.LoadDefaultConfig(context.TODO(),
			config.WithRegion(region),
			config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(keyID, secretKey, "")),
		)
	} else {
		cfg, err = config.LoadDefaultConfig(context.TODO(),
			config.WithRegion(region),
		)
	}

	if err != nil {
		return nil, fmt.Errorf("unable to load SDK config, %v", err)
	}

	client := s3.NewFromConfig(cfg, func(o *s3.Options) {
		if endpoint != "" {
			o.BaseEndpoint = aws.String(endpoint)
			o.UsePathStyle = true
		}
	})

	return &S3Provider{
		client:        client,
		presignClient: s3.NewPresignClient(client),
		bucket:        bucket,
		region:        region,
	}, nil
}

func (p *S3Provider) Upload(ctx context.Context, key string, body io.Reader, contentType string) (string, error) {
	_, err := p.client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(p.bucket),
		Key:         aws.String(key),
		Body:        body,
		ContentType: aws.String(contentType),
	})
	if err != nil {
		return "", fmt.Errorf("failed to upload object, %v", err)
	}

	return key, nil
}

func (p *S3Provider) GetURL(ctx context.Context, key string) (string, error) {
	return p.getPresignedURL(ctx, key)
}

func (p *S3Provider) getPresignedURL(ctx context.Context, key string) (string, error) {
	presignedRequest, err := p.presignClient.PresignGetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(p.bucket),
		Key:    aws.String(key),
	}, s3.WithPresignExpires(24*time.Hour))

	if err != nil {
		return "", fmt.Errorf("failed to generate presigned URL, %v", err)
	}

	return presignedRequest.URL, nil
}

func (p *S3Provider) Delete(ctx context.Context, key string) error {
	_, err := p.client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(p.bucket),
		Key:    aws.String(key),
	})
	return err
}
