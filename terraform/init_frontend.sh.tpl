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

# Pull latest frontend image
docker pull ${ecr_url}:latest

# Stop and remove any existing container and unused images
docker rm -f frontend || true
docker image prune -af

# Run frontend container mapping host port 80 to container port 80
docker run -d --name frontend -p 80:80 ${ecr_url}:latest

# Ensure container restarts automatically
docker update --restart unless-stopped frontend
