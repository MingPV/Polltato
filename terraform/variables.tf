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
