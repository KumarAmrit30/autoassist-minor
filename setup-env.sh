#!/bin/bash

# Environment Setup Script for AutoAssist
# This script helps set up local development environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_status "Setting up AutoAssist development environment..."

# Check if .env.local already exists
if [ -f ".env.local" ]; then
    print_warning ".env.local already exists!"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Keeping existing .env.local file"
        exit 0
    fi
fi

# Copy template to .env.local
if [ -f "env.local.template" ]; then
    cp env.local.template .env.local
    print_success "Created .env.local from template"
else
    print_error "env.local.template not found!"
    exit 1
fi

# Make the file readable only by owner for security
chmod 600 .env.local
print_status "Set secure permissions on .env.local"

print_success "Environment setup complete!"
print_status "Please review and update .env.local with your specific values:"
echo ""
echo "  - Update MONGODB_URI database name to 'autoassist_dev'"
echo "  - Update NEXTAUTH_SECRET with a secure secret"
echo "  - Review other configuration values"
echo ""
print_status "To start development:"
echo "  npm run dev"
