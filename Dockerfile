# Multi-stage build: build with Node, serve with nginx
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --silent

# Copy source and build
COPY . .
RUN npm run build

FROM nginx:1.25-alpine

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Replace default nginx config with SPA-friendly config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
