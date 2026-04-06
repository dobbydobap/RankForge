#!/bin/bash
set -e

echo "Installing dependencies..."
npm install -g pnpm
pnpm install --frozen-lockfile=false

echo "Building shared packages..."
cd packages/shared && pnpm build && cd ../..
cd packages/segment-tree && pnpm build && cd ../..

echo "Generating Prisma client..."
cd apps/api && npx prisma generate

echo "Building API..."
npx nest build

echo "Running database migrations..."
npx prisma db push --accept-data-loss

echo "Build complete!"
