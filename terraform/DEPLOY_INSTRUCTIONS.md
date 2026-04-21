# Polltato AWS Deployment Guide

For architecture details, see [`infrastructure_design.md`](./infrastructure_design.md).

---

## Prerequisites

1. Complete [`setup.md`](./setup.md) and activate your AWS profile:
   ```bash
   export AWS_PROFILE=my-dev-role
   ```
2. Docker must be running locally (used to build images).
3. `terraform` and `aws` CLI installed.

---

## 1. Initial Deployment

```bash
cd terraform

# First time only — downloads AWS provider
terraform init

# Preview what will be created
terraform plan

# Full deploy: VPC + Subnets + EC2 + RDS + ECR + CloudFront + EventBridge + SSM
terraform apply
```

Terraform will automatically:
1. Create all networking (VPC, subnets, NAT Gateway, Internet Gateway, and Frontend EIP).
2. Create ECR repositories for frontend and backend.
3. Build and push Docker images (`linux/amd64`) to ECR.
4. Launch EC2 instances (frontend in public subnet, backend in private subnet).
5. Create the CloudFront distribution.
6. Provision SSM Parameter Store entry (CloudFront URL).
7. Set up EventBridge rules and SSM documents for automated container restarts.

> Allow **~5 minutes** for EC2 instances to boot and pull their initial Docker images.

---

## 2. Get the App URLs

```bash
# CloudFront URL (primary, HTTPS)
terraform output cloudfront_domain_name

# Direct EC2 IP (for load testing comparison)
terraform output frontend_ec2_public_ip
```

| Access Method | URL | Purpose |
|---|---|---|
| CloudFront (HTTPS) | `https://<cloudfront_domain>` | Primary app access |
| Direct EC2 (HTTP) | `http://<ec2_public_ip>` | Load testing baseline |

---

## 3. Automated Container Updates (Event-Driven)

After the initial deploy, pushing a new image triggers a **fully automated** container restart — no SSH needed.

```bash
# From the project root — build and push updated images
cd terraform
bash build_and_push.sh
```

The automation flow:
```
docker push :latest → ECR → EventBridge Rule → SSM SendCommand → restart_*.sh on EC2
```

Both frontend and backend have independent EventBridge rules; pushing one image only restarts that service.

---

## 4. Force Rebuilding Images

Images are rebuilt automatically when their `Dockerfile` changes. To force a rebuild at any time:

```bash
# Rebuild backend only
terraform apply -replace=null_resource.docker_build_push_backend

# Rebuild frontend only
terraform apply -replace=null_resource.docker_build_push_frontend

# Rebuild both at once
terraform apply \
  -replace=null_resource.docker_build_push_backend \
  -replace=null_resource.docker_build_push_frontend
```

---

## 5. Load Testing

Two k6 browser scripts are in the `load-test/` directory to compare CloudFront vs. direct EC2 performance.

#### Via CloudFront (CDN path)
```bash
k6 run \
  -e BASE_URL=https://$(terraform output -raw cloudfront_domain_name) \
  -e POLL_ID=<your-poll-uuid> \
  load-test/script.js
```

#### Direct to Frontend EC2 (no CDN)
```bash
k6 run \
  -e BASE_URL=http://$(terraform output -raw frontend_ec2_public_ip) \
  -e POLL_ID=<your-poll-uuid> \
  load-test/front_end_script.js
```

---

## 6. Teardown

```bash
terraform destroy
```

> **Note**: CloudFront distributions take 3–5 minutes to disable and destroy. This is expected.

---

## Key Files Reference

| File | Purpose |
|---|---|
| `infrastructure_design.md` | Full architecture diagram and component breakdown |
| `setup.md` | IAM and AWS CLI configuration |
| `build_and_push.sh` | Manual script to push latest images to ECR |
| `init_backend.sh.tpl` | Backend EC2 boot script (rendered by Terraform) |
| `init_frontend.sh.tpl` | Frontend EC2 boot script (rendered by Terraform) |
| `eventbridge_ssm.tf` | Automated deployment pipeline (no SSH) |
| `cloudfront.tf` | CDN + SSM Parameter Store for CloudFront URL |
| `compute.tf` | EC2 instances + Frontend EIP association |
| `security.tf` | Security group rules (CloudFront + public HTTP) |
