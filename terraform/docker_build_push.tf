locals {
  backend_dockerfile_hash  = filesha256("${path.module}/../backend/Dockerfile")
  frontend_dockerfile_hash = filesha256("${path.module}/../frontend/Dockerfile")
  ecr_registry             = split("/", aws_ecr_repository.backend.repository_url)[0]
}

# Step 1: Authenticate Docker with ECR (depends on both ECR repos existing)
resource "null_resource" "docker_login" {
  depends_on = [
    aws_ecr_repository.frontend,
    aws_ecr_repository.backend,
  ]

  triggers = {
    # Re-authenticate whenever the region changes
    region = var.aws_region
  }

  provisioner "local-exec" {
    command = "aws ecr get-login-password --region ${var.aws_region} | docker login --username AWS --password-stdin ${local.ecr_registry}"
  }
}

# Step 2a: Build and push Backend image
resource "null_resource" "docker_build_push_backend" {
  depends_on = [null_resource.docker_login]

  triggers = {
    dockerfile_hash = local.backend_dockerfile_hash
  }

  provisioner "local-exec" {
    command = <<-EOT
      docker build --platform linux/amd64 -t polltato-backend ${path.module}/../backend
      docker tag polltato-backend:latest ${aws_ecr_repository.backend.repository_url}:latest
      docker push ${aws_ecr_repository.backend.repository_url}:latest
    EOT
  }
}

# Step 2b: Build and push Frontend image (write .env first, then build)
resource "null_resource" "docker_build_push_frontend" {
  depends_on = [null_resource.docker_login]

  triggers = {
    dockerfile_hash = local.frontend_dockerfile_hash
  }

  provisioner "local-exec" {
    command = <<-EOT
      cat > ${path.module}/../frontend/.env <<EOF
VITE_APP_API_URL=/api/v1
VITE_APP_SOCKET_URL=/
VITE_APP_ENABLE_API_MOCKING=false
EOF
      docker build --platform linux/amd64 -t polltato-frontend ${path.module}/../frontend
      docker tag polltato-frontend:latest ${aws_ecr_repository.frontend.repository_url}:latest
      docker push ${aws_ecr_repository.frontend.repository_url}:latest
    EOT
  }
}
