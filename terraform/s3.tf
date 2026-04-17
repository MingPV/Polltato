resource "aws_s3_bucket" "main" {
  bucket        = "polltato-assets-${random_id.suffix.hex}"
  force_destroy = true
  tags = {
    Name = "polltato-s3-bucket"
  }
}

resource "aws_s3_bucket_cors_configuration" "main" {
  bucket = aws_s3_bucket.main.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE", "HEAD"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}
