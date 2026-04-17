#!/bin/bash
# Install Docker on Amazon Linux 2023 / Amazon Linux 2
# yum update -y
yum install docker -y || amazon-linux-extras install docker -y
systemctl start docker
systemctl enable docker

# Add ec2-user to docker group
usermod -a -G docker ec2-user

# Wait for network and metadata to be fully up
sleep 15

# Login to ECR
aws ecr get-login-password --region ${region} | docker login --username AWS --password-stdin ${ecr_url}

# Pull latest backend image
docker pull ${ecr_url}:latest

# Stop and remove any existing container and unused images
docker rm -f backend || true
docker image prune -af

# Run backend container, pass DB securely via environment
# We map host port 8080 (which Nginx proxy calls) to container port 8000 (Go APP_PORT default)
docker run -d --name backend -p 8080:8000 \
  -e DB_PORT="5432" \
  -e DB_HOST="${db_host}" \
  -e DB_USER="${db_user}" \
  -e DB_PASSWORD="${db_pass}" \
  -e DB_NAME="${db_name}" \
  -e DB_SSLMODE="require" \
  -e S3_BUCKET="${s3_bucket}" \
  -e S3_REGION="${region}" \
  -e JWT_SECRET="prod-secret-polltato" \
  -e JWT_EXPIRATION="86400" \
  -e APP_ENV="development" \
  -e CORS_ORIGIN="*" \
  -e FRONTEND_URL="*" \
  ${ecr_url}:latest

# Ensure container restarts automatically
docker update --restart unless-stopped backend
