# setup aws cli
## create IAM role for terraform

## create IAM user for terraform
### access need
- only sts:AssumeRole for that role

## configure aws cli
run
```bash
# 1. run this and enter your key and secret key from IAM user
aws configure --profile my-base-identity

# 2. Set the Role ARN
aws configure set profile.my-dev-role.role_arn arn:aws:iam::123456789012:role/YourTargetRole

# 3. Set the Source Profile (Your IAM User keys)
aws configure set profile.my-dev-role.source_profile my-base-identity
```


## update IAM role trust relationship
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::123456789012:user/IAM_USER_NAME"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

## export role on local
```bash
export AWS_PROFILE=my-dev-role
```

after this you can run terraform commands