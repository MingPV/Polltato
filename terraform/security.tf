# CloudFront origin-facing managed prefix list
# This contains all IP ranges CloudFront uses to connect to origins (EC2)
data "aws_ec2_managed_prefix_list" "cloudfront" {
  name = "com.amazonaws.global.cloudfront.origin-facing"
}

# ── Frontend Security Group ───────────────────────────────────────────────────
resource "aws_security_group" "frontend" {
  name        = "polltato-frontend-sg"
  description = "Security group for frontend EC2 instance"
  vpc_id      = aws_vpc.main.id

  # HTTP only from CloudFront — direct browser access is blocked
  ingress {
    description     = "HTTP from CloudFront only"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    prefix_list_ids = [data.aws_ec2_managed_prefix_list.cloudfront.id]
  }

  # SSH for administration (frontend is in public subnet)
  ingress {
    description = "SSH for admin"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "polltato-frontend-sg" }
}

# ── Backend Security Group ────────────────────────────────────────────────────
resource "aws_security_group" "backend" {
  name        = "polltato-backend-sg"
  description = "Security group for backend EC2 instance (private subnet)"
  vpc_id      = aws_vpc.main.id

  # API port from Frontend only
  ingress {
    description     = "API from Frontend SG"
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.frontend.id]
  }

  # All outbound allowed (needed for NAT → ECR/S3/SSM)
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "polltato-backend-sg" }
}

# ── Database Security Group ───────────────────────────────────────────────────
resource "aws_security_group" "database" {
  name        = "polltato-database-sg"
  description = "Security group for RDS instance (private subnet)"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "PostgreSQL from Backend SG"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.backend.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "polltato-database-sg" }
}
