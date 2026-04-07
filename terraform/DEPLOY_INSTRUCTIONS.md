# Polltato AWS Deployment Guide

A single `terraform apply` completes the full deployment:

```
ECR repos → Docker build & push → EC2 instances
```

## Prerequisites
1. Completed `setup.md` and assumed the role:
   ```bash
   export AWS_PROFILE=my-dev-role
   ```
2. Docker installed and running locally.
3. `terraform` and `aws` CLI installed locally.

## Deployment

```bash
cd terraform
terraform init        # First time only
terraform plan        # Preview changes
terraform apply       # Full deploy: ECR + Docker build/push + EC2
```

Terraform will automatically:
1. Create ECR repositories.
2. Build and push the backend Docker image (`linux/amd64`).
3. Build and push the frontend Docker image (with `VITE_APP_API_URL=/api/v1`).
4. Launch EC2 instances (only after images are in ECR).

## Get the App URL

```bash
terraform output frontend_ec2_public_ip
```

Open that IP in your browser. Allow ~2 minutes for EC2 to boot and start the container.

## Rebuilding Images

Images are rebuilt automatically when their `Dockerfile` changes. To force a rebuild at any time:

```bash
terraform apply -replace=null_resource.docker_build_push_backend
terraform apply -replace=null_resource.docker_build_push_frontend
```

Or rebuild both:
```bash
terraform apply \
  -replace=null_resource.docker_build_push_backend \
  -replace=null_resource.docker_build_push_frontend
```

## Notes
- The old `build_and_push.sh` is no longer needed and can be safely removed.
- `docker_build_push.tf` manages the entire build pipeline.
- CloudFront is commented out in `cloudfront.tf`; uncomment once your AWS account is verified.
