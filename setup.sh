#!/bin/bash
set -e
echo "==================================================="
echo "  TerraMatch Full-Stack Startup Setup Script"
echo "==================================================="
echo ""
echo "[1/4] Installing Frontend dependencies..."
npm install

echo ""
echo "[2/4] Installing Backend dependencies..."
cd server
npm install

echo ""
echo "[3/4] Initializing PostgreSQL Schema with Prisma..."
npx prisma db push

echo ""
echo "[4/4] Seeding Database with Ghanaian Land Listings & Contractors..."
node prisma/seed.js

cd ..
echo ""
echo "==================================================="
echo "  🎉 Setup Completed Successfully!"
echo "  Run ./start.sh or 'npm run dev:all' to launch."
echo "==================================================="
