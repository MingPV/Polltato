# ── Data Sources ─────────────────────────────────────────────────────────────
data "aws_availability_zones" "available" {
  state = "available"
}

# ── VPC ──────────────────────────────────────────────────────────────────────
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = { Name = "polltato-vpc-${random_id.suffix.hex}" }
}

# ── Internet Gateway ──────────────────────────────────────────────────────────
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "polltato-igw-${random_id.suffix.hex}" }
}

# ── Subnets ───────────────────────────────────────────────────────────────────
# Public subnet – Frontend EC2 + NAT Gateway live here
resource "aws_subnet" "public_a" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = false # Public IP assigned explicitly per instance

  tags = { Name = "polltato-public-a-${random_id.suffix.hex}" }
}

# Private subnet – Backend EC2 (no public IP, egress via NAT)
resource "aws_subnet" "private_backend" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = data.aws_availability_zones.available.names[0]

  tags = { Name = "polltato-private-backend-${random_id.suffix.hex}" }
}

# Private subnets – RDS requires ≥ 2 AZs for its subnet group
resource "aws_subnet" "private_db_a" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.3.0/24"
  availability_zone = data.aws_availability_zones.available.names[0]

  tags = { Name = "polltato-private-db-a-${random_id.suffix.hex}" }
}

resource "aws_subnet" "private_db_b" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.4.0/24"
  availability_zone = data.aws_availability_zones.available.names[1]

  tags = { Name = "polltato-private-db-b-${random_id.suffix.hex}" }
}

# ── NAT Gateway ───────────────────────────────────────────────────────────────
# Provides outbound internet access for the private backend subnet
# (needed to pull Docker images from ECR and reach S3/SSM)
resource "aws_eip" "nat" {
  domain     = "vpc"
  depends_on = [aws_internet_gateway.main]
  tags       = { Name = "polltato-nat-eip-${random_id.suffix.hex}" }
}

# Frontend Elastic IP
resource "aws_eip" "frontend" {
  domain     = "vpc"
  depends_on = [aws_internet_gateway.main]
  tags       = { Name = "polltato-frontend-eip-${random_id.suffix.hex}" }
}

resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public_a.id # NAT GW must be in a PUBLIC subnet
  depends_on    = [aws_internet_gateway.main]
  tags          = { Name = "polltato-nat-gw-${random_id.suffix.hex}" }
}

# ── Route Tables ──────────────────────────────────────────────────────────────
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = { Name = "polltato-rt-public-${random_id.suffix.hex}" }
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }

  tags = { Name = "polltato-rt-private-${random_id.suffix.hex}" }
}

# ── Route Table Associations ──────────────────────────────────────────────────
resource "aws_route_table_association" "public_a" {
  subnet_id      = aws_subnet.public_a.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private_backend" {
  subnet_id      = aws_subnet.private_backend.id
  route_table_id = aws_route_table.private.id
}

resource "aws_route_table_association" "private_db_a" {
  subnet_id      = aws_subnet.private_db_a.id
  route_table_id = aws_route_table.private.id
}

resource "aws_route_table_association" "private_db_b" {
  subnet_id      = aws_subnet.private_db_b.id
  route_table_id = aws_route_table.private.id
}

# ── RDS Subnet Group ──────────────────────────────────────────────────────────
resource "aws_db_subnet_group" "main" {
  name       = "polltato-db-subnet-group-${random_id.suffix.hex}"
  subnet_ids = [aws_subnet.private_db_a.id, aws_subnet.private_db_b.id]

  tags = { Name = "polltato-db-subnet-group-${random_id.suffix.hex}" }
}
