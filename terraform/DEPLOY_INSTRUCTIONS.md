# Polltato AWS Deployment Guide

This guide covers the end-to-end sequence for deploying your Terraform infrastructure and pushing your frontend and backend code to AWS.

## Prerequisites
1. You have completed the steps in `setup.md` and successfully assumed the `my-dev-role`.
   ```bash
   export AWS_PROFILE=my-dev-role
   ```
2. You have Docker installed and running locally.
3. You have `terraform` installed locally.
4. You have the AWS CLI installed locally.

## Step-by-Step Deployment Sequence

### Phase 1: Provision Infrastructure
First, we use Terraform to create the VPC, Security Groups, ECR Repositories, RDS Database, and EC2 instances.

1. Navigate to the terraform directory:
   ```bash
   cd terraform
   ```
2. Initialize Terraform (downloads AWS provider):
   ```bash
   terraform init
   ```
3. Preview the changes:
   ```bash
   terraform plan
   ```
   *Note: You may be prompted for `var.db_password`. This is the password for your new RDS database (defaults to the value in `variables.tf`).*
4. Apply the configuration to build the infrastructure:
   ```bash
   terraform apply
   ```
   Type `yes` when prompted to confirm. **This step will take a few minutes** as it creates the database and EC2 instances.

### Phase 2: Build and Push Docker Images
Now that the ECR repositories exist, you need to build your frontend and backend Docker images and push them to AWS. We've added `Dockerfile`s to both your `frontend/` and `backend/` directories.

1. Remain in the `terraform` directory.
2. Run the provided build and push script:
   ```bash
   ./build_and_push.sh
   ```
   *Note: This script automatically reads the region and ECR repository URLs directly from the Terraform outputs. It then uses Docker to build both projects and pushes them to AWS.*

### Phase 3: Application Startup
Your EC2 instances were configured with startup scripts (`init_frontend.sh.tpl` and `init_backend.sh.tpl`). They are designed to:
1. Automatically install Docker on boot.
2. Authenticate securely with ECR using their IAM Instance Profile.
3. Pull the latest Docker images that you just pushed in Phase 2.
4. Run the containers and automatically connect the backend to the RDS database variables injected by Terraform.

*Note: Since the EC2 instances boot up before you push your images, they might fail to pull the images initially. Once you push your images, you might need to SSH into them and run `sudo systemctl restart docker` or manually pull/run the images if they didn't catch it on the retry loop.*

### Phase 4: Verification
1. Run `terraform output frontend_ec2_public_ip` to get the public IP of your application.
2. Open that IP address in your browser! It may take a few minutes for the EC2 instance to finish booting and pulling the Docker containers.

*Note: Once your AWS account is verified, you can uncomment `cloudfront.tf` and the output block in `outputs.tf` to restore the CloudFront CDN.*
