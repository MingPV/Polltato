# IAM Role for EC2 instances to pull from ECR
data "aws_iam_policy_document" "ec2_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "ec2_ecr_role" {
  name               = "polltato-ec2-ecr-role"
  assume_role_policy = data.aws_iam_policy_document.ec2_assume_role.json
}

resource "aws_iam_role_policy_attachment" "ecr_readonly" {
  role       = aws_iam_role.ec2_ecr_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "polltato-ec2-profile"
  role = aws_iam_role.ec2_ecr_role.name
}

# IAM User for CI/CD pipeline to push images to ECR securely
resource "aws_iam_user" "ci_user" {
  name = "polltato-ci-user"
}

resource "aws_iam_access_key" "ci_user" {
  user = aws_iam_user.ci_user.name
}

data "aws_iam_policy_document" "ecr_push_policy" {
  statement {
    actions = [
      "ecr:GetAuthorizationToken",
      "ecr:BatchCheckLayerAvailability",
      "ecr:GetDownloadUrlForLayer",
      "ecr:GetRepositoryPolicy",
      "ecr:DescribeRepositories",
      "ecr:ListImages",
      "ecr:DescribeImages",
      "ecr:BatchGetImage",
      "ecr:InitiateLayerUpload",
      "ecr:UploadLayerPart",
      "ecr:CompleteLayerUpload",
      "ecr:PutImage",
    ]
    resources = ["*"]
  }
}

resource "aws_iam_user_policy" "ci_user_policy" {
  name   = "polltato-ecr-push-policy"
  user   = aws_iam_user.ci_user.name
  policy = data.aws_iam_policy_document.ecr_push_policy.json
}

resource "aws_iam_policy" "ec2_s3_policy" {
  name        = "polltato-ec2-s3-policy"
  description = "Allows EC2 instances to access the S3 bucket"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Effect = "Allow"
        Resource = [
          aws_s3_bucket.main.arn,
          "${aws_s3_bucket.main.arn}/*"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ec2_s3_access" {
  role       = aws_iam_role.ec2_ecr_role.name
  policy_arn = aws_iam_policy.ec2_s3_policy.arn
}
