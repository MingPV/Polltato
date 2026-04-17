# ─────────────────────────────────────────────────────────────────────────────
# EventBridge + SSM Auto-Update
#
# Flow:
#   build_and_push.sh pushes image to ECR
#     → ECR emits "ECR Image Action" event
#       → EventBridge rule matches (PUSH on :latest tag)
#         → EventBridge invokes SSM SendCommand on the target EC2
#           → SSM runs /home/ec2-user/restart_*.sh on the instance
#             → docker pull + container restart (zero SSH needed)
# ─────────────────────────────────────────────────────────────────────────────

data "aws_caller_identity" "current" {}

# ── SSM Documents ─────────────────────────────────────────────────────────────
# Each document calls the pre-written restart script on the target EC2.
# The scripts themselves contain all credentials (baked in via user_data).

resource "aws_ssm_document" "update_frontend" {
  name          = "polltato-update-frontend"
  document_type = "Command"

  content = jsonencode({
    schemaVersion = "2.2"
    description   = "Pull latest frontend image from ECR and restart the container."
    mainSteps = [
      {
        action = "aws:runShellScript"
        name   = "UpdateFrontend"
        inputs = {
          runCommand     = ["bash /home/ec2-user/restart_frontend.sh"]
          timeoutSeconds = "120"
        }
      }
    ]
  })

  tags = {
    Name = "polltato-update-frontend"
  }
}

resource "aws_ssm_document" "update_backend" {
  name          = "polltato-update-backend"
  document_type = "Command"

  content = jsonencode({
    schemaVersion = "2.2"
    description   = "Pull latest backend image from ECR and restart the container."
    mainSteps = [
      {
        action = "aws:runShellScript"
        name   = "UpdateBackend"
        inputs = {
          runCommand     = ["bash /home/ec2-user/restart_backend.sh"]
          timeoutSeconds = "120"
        }
      }
    ]
  })

  tags = {
    Name = "polltato-update-backend"
  }
}

# ── IAM Role – EventBridge → SSM ─────────────────────────────────────────────
# EventBridge needs permission to call ssm:SendCommand.
# This is a separate role from the EC2 instance role.

resource "aws_iam_role" "eventbridge_ssm_role" {
  name = "polltato-eventbridge-ssm-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = "sts:AssumeRole"
        Principal = {
          Service = "events.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "eventbridge_ssm_policy" {
  name = "polltato-eventbridge-ssm-policy"
  role = aws_iam_role.eventbridge_ssm_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = ["ssm:SendCommand"]
        Resource = [
          # Allow sending the specific SSM documents
          aws_ssm_document.update_frontend.arn,
          aws_ssm_document.update_backend.arn,
          # Allow targeting the specific EC2 instances
          "arn:aws:ec2:${var.aws_region}:${data.aws_caller_identity.current.account_id}:instance/${aws_instance.frontend.id}",
          "arn:aws:ec2:${var.aws_region}:${data.aws_caller_identity.current.account_id}:instance/${aws_instance.backend.id}",
        ]
      }
    ]
  })
}

# ── EventBridge Rules ─────────────────────────────────────────────────────────
# Trigger on ECR "PUSH" events for the :latest tag on each repo.

resource "aws_cloudwatch_event_rule" "ecr_push_frontend" {
  name        = "polltato-ecr-push-frontend"
  description = "Fires when a new :latest image is pushed to polltato-frontend ECR repo."

  event_pattern = jsonencode({
    source        = ["aws.ecr"]
    "detail-type" = ["ECR Image Action"]
    detail = {
      "action-type"     = ["PUSH"]
      result            = ["SUCCESS"]
      "repository-name" = [aws_ecr_repository.frontend.name]
      "image-tag"       = ["latest"]
    }
  })
}

resource "aws_cloudwatch_event_rule" "ecr_push_backend" {
  name        = "polltato-ecr-push-backend"
  description = "Fires when a new :latest image is pushed to polltato-backend ECR repo."

  event_pattern = jsonencode({
    source        = ["aws.ecr"]
    "detail-type" = ["ECR Image Action"]
    detail = {
      "action-type"     = ["PUSH"]
      result            = ["SUCCESS"]
      "repository-name" = [aws_ecr_repository.backend.name]
      "image-tag"       = ["latest"]
    }
  })
}

# ── EventBridge Targets ───────────────────────────────────────────────────────
# Wire each rule to SSM SendCommand on the correct EC2 instance.

resource "aws_cloudwatch_event_target" "frontend_ssm" {
  rule      = aws_cloudwatch_event_rule.ecr_push_frontend.name
  target_id = "FrontendSSMUpdate"
  arn       = "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:document/${aws_ssm_document.update_frontend.name}"
  role_arn  = aws_iam_role.eventbridge_ssm_role.arn

  run_command_targets {
    key    = "InstanceIds"
    values = [aws_instance.frontend.id]
  }
}

resource "aws_cloudwatch_event_target" "backend_ssm" {
  rule      = aws_cloudwatch_event_rule.ecr_push_backend.name
  target_id = "BackendSSMUpdate"
  arn       = "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:document/${aws_ssm_document.update_backend.name}"
  role_arn  = aws_iam_role.eventbridge_ssm_role.arn

  run_command_targets {
    key    = "InstanceIds"
    values = [aws_instance.backend.id]
  }
}
