#!/bin/bash
set -e

echo "Installing dependencies..."
# Pin to the repo's packageManager version — a bare install drifts to whatever
# major pnpm is latest and reinterprets the lockfile/workspace settings.
npm install -g pnpm@10.33.0
pnpm install --frozen-lockfile

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
ls -la dist/modules/ratings/ratingCalculator.js

echo "Running database migrations..."
npx prisma db push --accept-data-loss

echo "Build complete!"
