#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# build_and_push.sh — Build and push Docker images to AWS ECR
#
# DEPLOYMENT ORDER:
#   1. terraform apply          ← provision ALL infrastructure first
#                                 (ECR, EC2, CloudFront, EventBridge, SSM)
#   2. bash build_and_push.sh   ← build & push images (this script)
#
# After step 2, EventBridge automatically detects the ECR push and triggers
# SSM to pull the new image and restart the container on EC2.
# Every subsequent push will also be auto-deployed the same way.
# ─────────────────────────────────────────────────────────────────────────────

# Exit on any failure
set -e

# Run this script from the terraform directory, or adjust the paths!
cd "$(dirname "$0")"

echo "Checking Terraform outputs..."
REGION=$(terraform output -raw aws_region)
FRONTEND_ECR=$(terraform output -raw frontend_ecr_repository_url)
BACKEND_ECR=$(terraform output -raw backend_ecr_repository_url)

if [ -z "$FRONTEND_ECR" ]; then
    echo "Error: Cannot find Terraform outputs. Ensure you have run 'terraform apply' first."
    exit 1
fi

echo "Authenticating with ECR..."
# Log into AWS ECR
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin "$(echo $FRONTEND_ECR | cut -d'/' -f1)"

# Modify these paths to match where your actual Application source code is
FRONTEND_SOURCE_DIR="../frontend"
BACKEND_SOURCE_DIR="../backend"

echo "Building and pushing Frontend..."
if [ -d "$FRONTEND_SOURCE_DIR" ]; then
    # The frontend is now configured with an NGINX reverse proxy inside the EC2 instance
    # that routes /api requests to the backend private IP directly!
    cat <<EOF > "$FRONTEND_SOURCE_DIR/.env"
VITE_APP_API_URL=/api/v1
VITE_APP_SOCKET_URL=/
VITE_APP_ENABLE_API_MOCKING=false
EOF
    
    docker build --platform linux/amd64 -t polltato-frontend $FRONTEND_SOURCE_DIR
    docker tag polltato-frontend:latest $FRONTEND_ECR:latest
    docker push $FRONTEND_ECR:latest
    echo "Frontend pushed to ECR."
else
    echo "Warning: Frontend directory $FRONTEND_SOURCE_DIR not found. Skipping build."
fi

echo "Building and pushing Backend..."
if [ -d "$BACKEND_SOURCE_DIR" ]; then
    docker build --platform linux/amd64 -t polltato-backend $BACKEND_SOURCE_DIR
    docker tag polltato-backend:latest $BACKEND_ECR:latest
    docker push $BACKEND_ECR:latest
    echo "Backend pushed to ECR."
else
    echo "Warning: Backend directory $BACKEND_SOURCE_DIR not found. Skipping build."
fi

echo "All done!"
