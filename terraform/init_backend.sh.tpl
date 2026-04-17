#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Backend EC2 init script
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

# ── Persistent restart script (called by SSM on every image push) ─────────────
# Terraform substitutes all $${...} template vars at render time, so credentials
# and connection strings are baked into the script on disk — not stored in SSM.
cat << 'RESTART' > /home/ec2-user/restart_backend.sh
#!/bin/bash
set -e
REGION="${region}"
ECR_URL="${ecr_url}"

echo "[restart_backend] Authenticating with ECR..."
aws ecr get-login-password --region "$REGION" | \
  docker login --username AWS --password-stdin "$(echo "$ECR_URL" | cut -d'/' -f1)"

echo "[restart_backend] Pulling latest image..."
docker pull "$ECR_URL:latest"

echo "[restart_backend] Replacing container..."
docker rm -f backend || true
docker image prune -af

docker run -d --name backend -p 8080:8000 \
  -e DB_PORT="5432" \
  -e DB_HOST="${db_host}" \
  -e DB_USER="${db_user}" \
  -e DB_PASSWORD="${db_pass}" \
  -e DB_NAME="${db_name}" \
  -e DB_SSLMODE="require" \
  -e S3_BUCKET="${s3_bucket}" \
  -e S3_REGION="${region}" \
  -e JWT_SECRET="prod-secret-polltato" \
  -e JWT_EXPIRATION="86400" \
  -e APP_ENV="development" \
  -e CORS_ORIGIN="*" \
  -e FRONTEND_URL="*" \
  "$ECR_URL:latest"

docker update --restart unless-stopped backend
echo "[restart_backend] Container updated successfully."
RESTART

chmod +x /home/ec2-user/restart_backend.sh

# ── Attempt initial container start ───────────────────────────────────────────
# This may fail gracefully if no image has been pushed to ECR yet.
# The container will be started automatically by EventBridge → SSM after the
# first push from build_and_push.sh.
echo "Attempting initial container start..."
bash /home/ec2-user/restart_backend.sh || {
  echo "WARNING: No image found in ECR yet."
  echo "Run build_and_push.sh to push the first image."
  echo "EventBridge will trigger SSM to start the container automatically."
}
