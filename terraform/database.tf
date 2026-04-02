
resource "aws_db_instance" "postgres" {
  identifier        = "polltato-postgres"
  engine            = "postgres"
  instance_class    = "db.t3.micro" # Free tier eligible
  allocated_storage = 20            # Free tier max
  storage_type      = "gp2"
  db_name           = var.db_name
  username          = var.db_username
  password          = var.db_password

  vpc_security_group_ids = [aws_security_group.database.id]
  skip_final_snapshot    = true
  publicly_accessible    = false

  tags = {
    Name = "polltato-rds"
  }
}
