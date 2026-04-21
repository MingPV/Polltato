# Polltato AWS Setup Guide

Prerequisites to configure before running any Terraform commands.

---

## 1. Tools Required

Install the following on your local machine:

| Tool | Purpose | Install |
|---|---|---|
| `terraform` | Provision AWS infrastructure | [terraform.io](https://developer.hashicorp.com/terraform/install) |
| `aws` CLI | Authenticate and interact with AWS | [AWS docs](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html) |
| `docker` | Build and push container images | [docker.com](https://docs.docker.com/get-docker/) |

---

## 2. IAM Setup in AWS Console

### Create a Terraform IAM Role

This role will be assumed by your local machine to provision infrastructure.

**Required Permissions**: Attach `AdministratorAccess` (or a scoped policy covering EC2, ECR, RDS, S3, VPC, IAM, CloudFront, SSM, EventBridge).

### Create a Terraform IAM User

This is the identity your local machine will authenticate as. It only needs permission to assume the role above.

**Inline Policy:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "sts:AssumeRole",
      "Resource": "arn:aws:iam::<ACCOUNT_ID>:role/<YOUR_TERRAFORM_ROLE_NAME>"
    }
  ]
}
```

### Update the Role's Trust Relationship

Allow the IAM user above to assume the role:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::<ACCOUNT_ID>:user/<IAM_USER_NAME>"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

---

## 3. Configure AWS CLI

```bash
# 1. Configure your IAM user credentials
aws configure --profile my-base-identity
# Enter: AWS Access Key ID, Secret Access Key, region (e.g. us-west-2), output format (json)

# 2. Set the role to assume
aws configure set profile.my-dev-role.role_arn arn:aws:iam::<ACCOUNT_ID>:role/<YOUR_TERRAFORM_ROLE_NAME>

# 3. Set the source profile (the IAM user credentials above)
aws configure set profile.my-dev-role.source_profile my-base-identity
```

---

## 4. Activate the Profile

**Option A — Role-based (recommended):**
```bash
export AWS_PROFILE=my-dev-role
```

**Option B — Direct Access Keys:**
```bash
export AWS_ACCESS_KEY_ID=your_access_key_id
export AWS_SECRET_ACCESS_KEY=your_secret_access_key
export AWS_DEFAULT_REGION=us-west-2
```

---

## 5. Terraform Variables

Create a `terraform.tfvars` file in the `terraform/` directory (never commit this):

```hcl
aws_region   = "us-west-2"
db_username  = "polltato"
db_password  = "your-secure-password"
db_name      = "polltato_db"
```

You are now ready to follow [`DEPLOY_INSTRUCTIONS.md`](./DEPLOY_INSTRUCTIONS.md).