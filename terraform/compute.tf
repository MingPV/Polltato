data "aws_ami" "amazon_linux_2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-2023.*-x86_64"]
  }
}

resource "aws_instance" "frontend" {
  ami                    = data.aws_ami.amazon_linux_2023.id
  instance_type          = "t3.micro" # Free tier eligible in newer regions
  vpc_security_group_ids = [aws_security_group.frontend.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name

  user_data = templatefile("${path.module}/init_frontend.sh.tpl", {
    region             = var.aws_region
    ecr_url            = aws_ecr_repository.frontend.repository_url
    backend_private_ip = aws_instance.backend.private_ip
  })

  user_data_replace_on_change = true

  tags = {
    Name = "polltato-frontend"
  }
}

resource "aws_instance" "backend" {
  ami                    = data.aws_ami.amazon_linux_2023.id
  instance_type          = "t3.micro"
  vpc_security_group_ids = [aws_security_group.backend.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name

  user_data = templatefile("${path.module}/init_backend.sh.tpl", {
    region    = var.aws_region
    ecr_url   = aws_ecr_repository.backend.repository_url
    db_host   = aws_db_instance.postgres.address
    db_user   = var.db_username
    db_pass   = var.db_password
    db_name   = var.db_name
    s3_bucket = aws_s3_bucket.main.id
  })

  user_data_replace_on_change = true

  tags = {
    Name = "polltato-backend"
  }
}
