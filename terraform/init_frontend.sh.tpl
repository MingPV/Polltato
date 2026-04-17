#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Frontend EC2 init script
# Runs once on first boot. Writes a persistent restart script that SSM
# will call on every subsequent ECR image push (via EventBridge).
# ─────────────────────────────────────────────────────────────────────────────

# Install Docker
yum update -y
yum install docker -y || amazon-linux-extras install docker -y
systemctl start docker
systemctl enable docker
usermod -a -G docker ec2-user

# Wait for network and metadata to be fully up
sleep 15

# ── NGINX reverse-proxy config ────────────────────────────────────────────────
# Written once to disk; reused by restart_frontend.sh on every update.
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

    # Support WebSockets for Socket.IO
    location /socket.io/ {
        proxy_pass http://${backend_private_ip}:8080/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# ── Persistent restart script (called by SSM on every image push) ─────────────
# Terraform substitutes ${region} and ${ecr_url} at template-render time, so
# the final script on disk has the real values baked in.
cat << 'RESTART' > /home/ec2-user/restart_frontend.sh
#!/bin/bash
set -e
REGION="${region}"
ECR_URL="${ecr_url}"

echo "[restart_frontend] Authenticating with ECR..."
aws ecr get-login-password --region "$REGION" | \
  docker login --username AWS --password-stdin "$(echo "$ECR_URL" | cut -d'/' -f1)"

echo "[restart_frontend] Pulling latest image..."
docker pull "$ECR_URL:latest"

echo "[restart_frontend] Replacing container..."
docker rm -f frontend || true
docker image prune -af

docker run -d --name frontend -p 80:80 \
  -v /home/ec2-user/nginx.conf:/etc/nginx/conf.d/default.conf:ro \
  "$ECR_URL:latest"

docker update --restart unless-stopped frontend
echo "[restart_frontend] Container updated successfully."
RESTART

chmod +x /home/ec2-user/restart_frontend.sh

# ── Attempt initial container start ───────────────────────────────────────────
# This may fail gracefully if no image has been pushed to ECR yet.
# The container will be started automatically by EventBridge → SSM after the
# first push from build_and_push.sh.
echo "Attempting initial container start..."
bash /home/ec2-user/restart_frontend.sh || {
  echo "WARNING: No image found in ECR yet."
  echo "Run build_and_push.sh to push the first image."
  echo "EventBridge will trigger SSM to start the container automatically."
}
