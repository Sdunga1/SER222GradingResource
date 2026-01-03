#!/bin/bash

# Quick Start Guide for SER222 Practice Problems

echo "🚀 SER222 Practice Problems - Quick Start"
echo "=========================================="
echo ""

# Check if node_modules exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install --legacy-peer-deps
fi

# Check if database exists
echo ""
echo "🗄️  Checking database..."
if psql -U postgres -d ser222grading -c "SELECT 1" > /dev/null 2>&1; then
    echo "✅ Database already exists"
else
    echo "📝 Setting up database..."
    bash setup-db.sh
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "🎯 To start the development server:"
echo "   npm run dev"
echo ""
echo "📱 Then visit:"
echo "   http://localhost:3000/practice"
echo ""
echo "📖 For more info, see PRACTICE_SETUP.md"
