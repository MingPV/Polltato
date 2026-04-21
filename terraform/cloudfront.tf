# CloudFront Distribution – PriceClass_100 (pay-as-you-go, US/CA/EU edge nodes)
# Free tier: 1 TB data transfer + 10M HTTP requests per month
resource "aws_cloudfront_distribution" "frontend" {
  origin {
    domain_name = "ec2-${replace(aws_eip.frontend.public_ip, ".", "-")}.${var.aws_region}.compute.amazonaws.com"
    origin_id   = "FrontendEC2Origin"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only" # EC2 serves plain HTTP; CF handles HTTPS
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  enabled         = true
  is_ipv6_enabled = true
  price_class     = "PriceClass_100" # Cheapest: US, Canada, Europe

  # ── Default behavior: React SPA (/  and all static assets) ─────────────────
  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "FrontendEC2Origin"

    forwarded_values {
      query_string = true
      headers      = ["Host", "Origin", "Authorization"]

      cookies {
        forward = "all"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 0 # No default caching; backend controls via Cache-Control headers
    max_ttl                = 31536000
    compress               = true
  }

  # ── /api/* – Dynamic API requests (no caching, forward all headers) ─────────
  ordered_cache_behavior {
    path_pattern     = "/api/*"
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "FrontendEC2Origin"

    forwarded_values {
      query_string = true
      headers      = ["*"] # Forward all headers for auth tokens, content-type, etc.

      cookies {
        forward = "all"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0
    compress               = false
  }

  # ── /socket.io/* – WebSocket support (no caching, upgrade headers forwarded) ─
  ordered_cache_behavior {
    path_pattern     = "/socket.io/*"
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "FrontendEC2Origin"

    forwarded_values {
      query_string = true
      headers      = ["*"] # Must forward Upgrade + Connection for WebSocket handshake

      cookies {
        forward = "all"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0
    compress               = false
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # Use the free CloudFront default certificate (*.cloudfront.net)
  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Name = "polltato-frontend-cdn-${random_id.suffix.hex}"
  }
}

# ── SSM Parameter Store ───────────────────────────────────────────────────────
# Break the circular dependency: CloudFront writes its URL here, 
# and the Backend EC2 fetches it at runtime.
resource "aws_ssm_parameter" "frontend_url" {
  name        = "/polltato/frontend_url"
  description = "The CloudFront distribution domain name for Polltato frontend"
  type        = "String"
  value       = aws_cloudfront_distribution.frontend.domain_name

  tags = {
    Name = "polltato-frontend-url-param-${random_id.suffix.hex}"
  }
}
