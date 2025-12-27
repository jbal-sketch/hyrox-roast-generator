#!/bin/bash

# Script to push code to GitHub
# Run this AFTER creating the repository on GitHub

echo "🚀 Pushing Hyrox Roast Generator to GitHub..."
echo ""
echo "Please enter your GitHub username:"
read GITHUB_USERNAME

echo "Please enter your repository name (default: hyrox-roast-generator):"
read REPO_NAME
REPO_NAME=${REPO_NAME:-hyrox-roast-generator}

echo ""
echo "Adding remote origin..."
git remote add origin https://github.com/${GITHUB_USERNAME}/${REPO_NAME}.git 2>/dev/null || git remote set-url origin https://github.com/${GITHUB_USERNAME}/${REPO_NAME}.git

echo "Setting branch to main..."
git branch -M main

echo "Pushing to GitHub..."
git push -u origin main

echo ""
echo "✅ Done! Your code is now on GitHub."
echo "Next step: Go to https://vercel.com and import your repository."

