locals {
  backend_dockerfile_hash  = filesha256("${path.module}/../backend/Dockerfile")
  frontend_dockerfile_hash = filesha256("${path.module}/../frontend/Dockerfile")
  backend_src_hash         = filesha256("${path.module}/../backend/go.mod")
  frontend_src_hash        = filesha256("${path.module}/../frontend/package.json")
  ecr_registry             = split("/", aws_ecr_repository.backend.repository_url)[0]
}

# Step 1: Create Frontend environment file
resource "local_file" "frontend_env" {
  filename = "${path.module}/../frontend/.env"
  content  = <<-EOT
VITE_APP_API_URL=/api/v1
VITE_APP_SOCKET_URL=/
VITE_APP_ENABLE_API_MOCKING=false
EOT
}

# Step 2: Create a robust PowerShell deployment script
resource "local_file" "deploy_script" {
  filename = "${path.module}/deploy.ps1"
  content  = <<-EOT
$ErrorActionPreference = 'Stop'
Write-Host "Starting Polltato Deployment Script..." -ForegroundColor Cyan

# 1. Login to ECR
Write-Host "Authenticating with ECR..." -ForegroundColor Yellow
$password = aws ecr get-login-password --region ${var.aws_region}
$password | docker login --username AWS --password-stdin ${local.ecr_registry}

# 2. Build and Push Backend
Write-Host "Building and Pushing Backend... (${aws_ecr_repository.backend.repository_url})" -ForegroundColor Yellow
docker build --platform linux/amd64 -t polltato-backend ${path.module}/../backend
docker tag polltato-backend:latest ${aws_ecr_repository.backend.repository_url}:latest
docker push ${aws_ecr_repository.backend.repository_url}:latest

# 3. Build and Push Frontend
Write-Host "Building and Pushing Frontend... (${aws_ecr_repository.frontend.repository_url})" -ForegroundColor Yellow
docker build --platform linux/amd64 -t polltato-frontend ${path.module}/../frontend
docker tag polltato-frontend:latest ${aws_ecr_repository.frontend.repository_url}:latest
docker push ${aws_ecr_repository.frontend.repository_url}:latest

Write-Host "Deployment Script Completed Successfully!" -ForegroundColor Green
EOT
}

# Step 3: Execute the deployment script
resource "null_resource" "docker_deploy" {
  depends_on = [
    aws_ecr_repository.frontend,
    aws_ecr_repository.backend,
    local_file.frontend_env,
    local_file.deploy_script
  ]

  triggers = {
    backend_docker_hash  = local.backend_dockerfile_hash
    backend_src_hash     = local.backend_src_hash
    frontend_docker_hash = local.frontend_dockerfile_hash
    frontend_src_hash    = local.frontend_src_hash
    env_hash             = sha256(local_file.frontend_env.content)
    script_hash          = sha256(local_file.deploy_script.content)
  }

  provisioner "local-exec" {
    interpreter = ["PowerShell", "-Command"]
    command     = "${path.module}/deploy.ps1"
  }
}



