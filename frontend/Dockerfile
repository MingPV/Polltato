FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json yarn.lock ./
# Note: ignoring scripts to prevent husky errors on build
RUN yarn install --frozen-lockfile --ignore-scripts

COPY . .
RUN yarn build

FROM nginx:alpine
# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
