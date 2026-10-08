#!/usr/bin/env bash
set -e

# Deployment Helper Script for GitHub Pages
# Usage: ./publish.sh <github-repo-url-with-token>
# Example: ./publish.sh https://YOUR_TOKEN@github.com/username/repo-name.git

REPO_URL="$1"

if [ -z "$REPO_URL" ]; then
  echo "Error: Please provide your GitHub repository URL (with Personal Access Token)."
  echo "Example:"
  echo "  ./publish.sh https://ghp_YOUR_TOKEN@github.com/username/my-repo.git"
  exit 1
fi

echo "==> Building production static bundle..."
npm run build

echo "==> Deploying directly to gh-pages branch..."
npx gh-pages -r "$REPO_URL" -d dist -m "Deploy to GitHub Pages"

echo "==> Successfully published to gh-pages branch!"
echo "Now go to GitHub -> Repository Settings -> Pages, ensure Source is set to 'Deploy from a branch' and Branch is 'gh-pages' / '/ (root)'."
