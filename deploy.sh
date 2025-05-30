#!/bin/bash

# Deployment script for Resume Chat Application

echo "🚀 Starting deployment process..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing git repository..."
    git init
    git add .
    git commit -m "Initial commit"
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "📝 Committing changes..."
    git add .
    git commit -m "Deploy: $(date)"
fi

echo "✅ Deployment preparation complete!"
echo ""
echo "🌐 Choose your deployment platform:"
echo "1. Railway (recommended)"
echo "2. Render"
echo "3. Heroku"
echo "4. DigitalOcean"
echo ""
echo "📋 Next steps:"
echo "1. Push your code to GitHub"
echo "2. Connect your chosen platform to your GitHub repo"
echo "3. Set environment variables (see .env.example)"
echo "4. Deploy!"
echo ""
echo "🔗 Useful links:"
echo "Railway: https://railway.app/"
echo "Render: https://render.com/"
echo "Heroku: https://heroku.com/"
echo "DigitalOcean: https://www.digitalocean.com/products/app-platform"
