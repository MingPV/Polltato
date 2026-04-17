variable "aws_region" {
  description = "AWS region (e.g., us-west-1 for N. California or ap-southeast-1)"
  type        = string
  default     = "us-west-1" # As suggested by "NCA"
}

variable "db_username" {
  description = "Database administrator username"
  type        = string
  default     = "admin_user"
}

variable "db_password" {
  description = "Database administrator password"
  type        = string
  # sensitive   = true
  default = "passwordnakub"
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "polltatodb"
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zone_a" {
  description = "Primary availability zone (us-west-1 has us-west-1a and us-west-1c)"
  type        = string
  default     = "us-west-1a"
}

variable "availability_zone_b" {
  description = "Secondary availability zone for RDS multi-AZ subnet group"
  type        = string
  default     = "us-west-1c" # us-west-1 only has 1a and 1c (no 1b)
}

variable "ssh_public_key" {
  description = "SSH public key for EC2 instances"
  type        = string
  default     = "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQCzUDTskCj8HJj5Xl2hkbmrtEtRAqbSvFZWfVUSpDtH7g0/J/y+Pw/gXWXrfX/g+otxPoGt/4LffdQMxmw7q5XQumAuG5IvBXr7oZBAxyy+AaSw8RaY4tmwH2Rvob2VXMnfsoU3B/dGgSx1ZEj1TfsR9MZhrz/38ks2QX7Fg4Y7xsPa6PLibDaTwzyWhNW6RE5VAgaTh22HzW1AMS3CpXaC+XKoQ0KAsLZI/wLdSttNgBQ+vHOc/uTHjGHZGTKckJFI3yT1vMxL8JXZJ6YESL6tAYH2s9TnZOyef3gwcfPGsVoeX5RPvl8Edbrthk+y5onDrgEqtibw0EQ7E3pL8xyL1GmS+3cG4ylIv9mf3kVAqS9epELhY+7clHcvRo81uGUJ4rl1E40ksMteZ6Rkv6TljdDQbchJl31oY40l+ly0dvBle2ua3fc9o68w63fEoih5GOxZfMMuJ9BaI6Os5JyJX2aAdqPjvLmkCoGWAyVF9v1Uh2Xi6DhHdILWpKqBH5mPt3EnRzQP6oo84y9ZuVV2p0jnmpIwXnBZBhf1gr/wXbiS4nI2XKcGDJCl/AnJ+hbItSPqTShCu4As//BD8xumv9WF5SotkHl9bxbSS30VUIzQbKtnXeGomXvZulEolcUCbUd05KFM7oa35P4w7SMXgp5tKBZDfgfdNhw1DLKGSw== user@LAPTOP-IJ1CABOK"
}
