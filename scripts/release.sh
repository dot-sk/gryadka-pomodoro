#!/bin/bash

# Release script for Gryadka
# This script bumps the version, creates a release tag, and pushes to remote
# The tag push triggers the GitHub Actions workflow (.github/workflows/release.yml)
#
# Usage:
#   ./scripts/release.sh           # Bump minor version (0.1.5 -> 0.2.0)
#   ./scripts/release.sh --patch   # Bump patch version (0.1.5 -> 0.1.6)
#   ./scripts/release.sh --major   # Bump major version (0.1.5 -> 1.0.0)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Parse arguments
BUMP_TYPE="minor"
while [[ $# -gt 0 ]]; do
    case $1 in
        --patch)
            BUMP_TYPE="patch"
            shift
            ;;
        --major)
            BUMP_TYPE="major"
            shift
            ;;
        --minor)
            BUMP_TYPE="minor"
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Usage: $0 [--patch|--minor|--major]"
            exit 1
            ;;
    esac
done

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$ROOT_DIR"

echo -e "${YELLOW}🚀 Starting $BUMP_TYPE release process...${NC}"

# Check if we're on master branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "master" ]; then
    echo -e "${RED}❌ Error: You must be on the master branch to release.${NC}"
    echo -e "   Current branch: $CURRENT_BRANCH"
    exit 1
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo -e "${RED}❌ Error: You have uncommitted changes. Please commit or stash them first.${NC}"
    exit 1
fi

# Check if working directory is clean (including untracked files)
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${RED}❌ Error: Working directory is not clean. Please commit or stash changes.${NC}"
    git status --short
    exit 1
fi

# Pull latest changes
echo -e "${YELLOW}📥 Pulling latest changes from origin/master...${NC}"
git pull origin master

# Get current version from package.json
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo -e "   Current version: ${GREEN}$CURRENT_VERSION${NC}"

# Parse version components
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"

# Calculate new version based on bump type
case $BUMP_TYPE in
    major)
        NEW_VERSION="$((MAJOR + 1)).0.0"
        ;;
    minor)
        NEW_VERSION="$MAJOR.$((MINOR + 1)).0"
        ;;
    patch)
        NEW_VERSION="$MAJOR.$MINOR.$((PATCH + 1))"
        ;;
esac

echo -e "   New version: ${GREEN}$NEW_VERSION${NC}"

# Confirm with user
echo ""
read -p "Do you want to release version $NEW_VERSION? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Release cancelled.${NC}"
    exit 0
fi

# Update package.json version
echo -e "${YELLOW}📝 Updating package.json...${NC}"
npm version "$NEW_VERSION" --no-git-tag-version

# package-lock.json is automatically updated by npm version

# Run tests before release
echo -e "${YELLOW}🧪 Running tests...${NC}"
npm test

# Run TypeScript type check
echo -e "${YELLOW}🔍 Running type check...${NC}"
npm run lint:ts

# Create commit for version bump
echo -e "${YELLOW}📦 Creating version bump commit...${NC}"
git add package.json package-lock.json
git commit -m "chore: bump version to $NEW_VERSION"

# Create annotated tag
TAG_NAME="v$NEW_VERSION"
echo -e "${YELLOW}🏷️  Creating tag $TAG_NAME...${NC}"
git tag -a "$TAG_NAME" -m "Release $NEW_VERSION"

# Push commit and tag
echo -e "${YELLOW}📤 Pushing to origin...${NC}"
git push origin master
git push origin "$TAG_NAME"

echo ""
echo -e "${GREEN}✅ Release $NEW_VERSION completed successfully!${NC}"
echo ""
echo -e "The GitHub Actions workflow will now build and publish the release."
echo -e "Check the progress at: https://github.com/dot-sk/gryadka-pomodoro/actions"
echo ""
echo -e "Tag: $TAG_NAME"
