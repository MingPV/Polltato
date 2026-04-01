#!/bin/bash
# Install Docker on Amazon Linux 2023 / Amazon Linux 2
yum update -y
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
# We inject these values securely at launch rather than baking them into the Docker image or source code.
docker run -d --name backend -p 80:8080 \
  -e DB_HOST="${db_host}" \
  -e DB_USER="${db_user}" \
  -e DB_PASS="${db_pass}" \
  -e DB_NAME="${db_name}" \
  ${ecr_url}:latest

# Ensure container restarts automatically
docker update --restart unless-stopped backend
