#!/bin/bash
set -e

echo "Installing dependencies..."
npm install -g pnpm
pnpm install --frozen-lockfile=false

echo "Building shared packages..."
cd packages/shared && npx tsc && cd ../..
cd packages/segment-tree && npx tsc && cd ../..

echo "Generating Prisma client..."
cd apps/api && npx prisma generate

echo "Building API..."
rm -rf dist tsconfig.tsbuildinfo
npx tsc

echo "Verifying build..."
ls -la dist/main.js
ls -la dist/modules/ratings/rating-calculator.js

echo "Running database migrations..."
npx prisma db push --accept-data-loss

echo "Build complete!"
