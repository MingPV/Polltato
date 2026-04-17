$ErrorActionPreference = 'Stop'
Write-Host "Starting Polltato Deployment Script..." -ForegroundColor Cyan

# 1. Login to ECR
Write-Host "Authenticating with ECR..." -ForegroundColor Yellow
$password = aws ecr get-login-password --region us-west-1
$password | docker login --username AWS --password-stdin 274655198366.dkr.ecr.us-west-1.amazonaws.com

# 2. Build and Push Backend
Write-Host "Building and Pushing Backend... (274655198366.dkr.ecr.us-west-1.amazonaws.com/polltato-backend)" -ForegroundColor Yellow
docker build --platform linux/amd64 -t polltato-backend ./../backend
docker tag polltato-backend:latest 274655198366.dkr.ecr.us-west-1.amazonaws.com/polltato-backend:latest
docker push 274655198366.dkr.ecr.us-west-1.amazonaws.com/polltato-backend:latest

# 3. Build and Push Frontend
Write-Host "Building and Pushing Frontend... (274655198366.dkr.ecr.us-west-1.amazonaws.com/polltato-frontend)" -ForegroundColor Yellow
docker build --platform linux/amd64 -t polltato-frontend ./../frontend
docker tag polltato-frontend:latest 274655198366.dkr.ecr.us-west-1.amazonaws.com/polltato-frontend:latest
docker push 274655198366.dkr.ecr.us-west-1.amazonaws.com/polltato-frontend:latest

Write-Host "Deployment Script Completed Successfully!" -ForegroundColor Green
