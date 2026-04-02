#!/bin/bash
# Install Docker on Amazon Linux 2023 / Amazon Linux 2
yum update -y
yum install docker -y || amazon-linux-extras install docker -y
systemctl start docker
systemctl enable docker

# Add ec2-user to docker group
usermod -a -G docker ec2-user

# Wait for network and metadata to be fully up
sleep 15

# Login to ECR
aws ecr get-login-password --region ${region} | docker login --username AWS --password-stdin ${ecr_url}

# Pull latest frontend image
docker pull ${ecr_url}:latest

# Stop and remove any existing container and unused images
docker rm -f frontend || true
docker image prune -af

# Create custom NGINX config to serve the React app and reverse-proxy the API
cat << 'EOF' > /home/ec2-user/nginx.conf
server {
    listen       80;
    server_name  _;

    # Serve the React application directly
    location / {
        root   /usr/share/nginx/html;
        index  index.html index.htm;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests securely to the private backend EC2 IP
    location /api/ {
        proxy_pass http://${backend_private_ip}:8080/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Run frontend container with the heavily constrained reverse proxy mounted
docker run -d --name frontend -p 80:80 \
  -v /home/ec2-user/nginx.conf:/etc/nginx/conf.d/default.conf:ro \
  ${ecr_url}:latest

# Ensure container restarts automatically
docker update --restart unless-stopped frontend
