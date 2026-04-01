#!/bin/bash
# Script to build and push Docker images to AWS ECR

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
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $(echo $FRONTEND_ECR | cut -d'/' -f1)

# Modify these paths to match where your actual Application source code is
FRONTEND_SOURCE_DIR="../frontend"
BACKEND_SOURCE_DIR="../backend"

echo "Building and pushing Frontend..."
if [ -d "$FRONTEND_SOURCE_DIR" ]; then
    # Dynamically change .env before building the image
    echo "Configuring frontend .env..."
    FRONTEND_IP=$(terraform output -raw frontend_ec2_public_ip)
    # NOTE: Since the backend is in a private subnet, you'll likely need an ALB or an Nginx reverse proxy.
    # Update this URL to match your actual backend endpoint routing setup!
    API_BASE_URL="http://$FRONTEND_IP"
    
    cat <<EOF > "$FRONTEND_SOURCE_DIR/.env"
VITE_APP_API_URL=$API_BASE_URL/api/v1
VITE_APP_SOCKET_URL=$API_BASE_URL
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
