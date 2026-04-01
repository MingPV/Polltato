FROM golang:1.24-alpine AS builder

WORKDIR /app

# Download Go modules
COPY go.mod go.sum* ./
RUN go mod download

# Copy the source code
COPY . .

# Build the Go app
RUN CGO_ENABLED=0 GOOS=linux go build -o main ./cmd/app/...

FROM alpine:latest  
RUN apk --no-cache add ca-certificates

WORKDIR /root/
# Copy the Pre-built binary file from the previous stage
COPY --from=builder /app/main .

EXPOSE 8080

CMD ["./main"]
