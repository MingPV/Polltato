output "aws_region" {
  value = var.aws_region
}

output "cloudfront_domain_name" {
  value       = aws_cloudfront_distribution.frontend.domain_name
  description = "The CloudFront URL — use this to access the app (HTTPS)"
}

output "frontend_ec2_public_ip" {
  value       = aws_eip.frontend.public_ip
  description = "Public IP of frontend EC2 (Elastic IP)"
}

output "frontend_ecr_repository_url" {
  value       = aws_ecr_repository.frontend.repository_url
  description = "ECR Repository URL for frontend"
}

output "backend_ecr_repository_url" {
  value       = aws_ecr_repository.backend.repository_url
  description = "ECR Repository URL for backend"
}

output "ci_user_access_key" {
  value       = aws_iam_access_key.ci_user.id
  description = "AWS Access Key ID for CI/CD script (Do NOT share this)"
}

output "ci_user_secret_key" {
  value       = aws_iam_access_key.ci_user.secret
  description = "AWS Secret Access Key for CI/CD script"
  sensitive   = true
}

output "s3_bucket" {
  value       = aws_s3_bucket.main.id
  description = "The S3 bucket for Polltato assets"
}
