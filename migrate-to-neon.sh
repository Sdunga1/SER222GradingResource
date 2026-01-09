#!/bin/bash
set -e

echo "🚀 Running migrations on Neon Postgres..."

# Load DATABASE_URL from .env.development.local
export $(cat .env.development.local | grep DATABASE_URL= | xargs)

# Run schema setup
echo "📊 Creating schema..."
psql "$DATABASE_URL" -f database/schema.sql

# Run all migrations in order
echo "🔄 Running migrations..."
for file in database/migrations/*.sql; do
  echo "  ✓ Running $(basename $file)..."
  psql "$DATABASE_URL" -f "$file"
done

echo "✅ Migrations complete! Your Neon database is ready."
