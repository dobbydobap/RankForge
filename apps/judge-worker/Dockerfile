FROM node:22-slim

# Install compilers for code execution
RUN apt-get update && apt-get install -y \
    g++ \
    python3 \
    openjdk-17-jdk-headless \
    golang-go \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy source
COPY . .
RUN pnpm build

# Run the worker
CMD ["node", "dist/worker.js"]
