#!/bin/bash

# Database setup script for SER222 Grading Practice Problems
# Usage: bash setup-db.sh

set -e

DB_URL="postgres://postgres:9254@localhost:5432/ser222grading"

echo "Setting up SER222 Grading Database..."

# Create database
echo "Creating database ser222grading..."
createdb -h localhost -U postgres ser222grading 2>/dev/null || echo "Database already exists"

# Run schema
echo "Running base schema..."
psql "$DB_URL" -f database/schema.sql

# Run migrations
echo "Running migration 001 (create practice tables)..."
psql "$DB_URL" -f database/migrations/001_create_practice_tables.sql

echo "Running migration 002 (user practice completion)..."
psql "$DB_URL" -f database/migrations/002_add_user_practice_completion.sql

echo "Running migration 003 (user practice stars)..."
psql "$DB_URL" -f database/migrations/003_add_user_practice_stars.sql

echo "Running migration 010 (feedback modules)..."
psql "$DB_URL" -f database/migrations/010_create_feedback_modules.sql

echo "Running migration 011 (feedback elements)..."
psql "$DB_URL" -f database/migrations/011_create_feedback_elements.sql

echo ""
echo "✓ Database setup complete!"
echo ""
echo "You can now:"
echo "1. Start the dev server: npm run dev"
echo "2. Visit: http://localhost:3000/practice"
