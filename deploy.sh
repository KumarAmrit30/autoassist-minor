#!/bin/bash

# AutoAssist Deployment Script
# This script helps manage deployments between dev and production

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Function to check if we're on the correct branch
check_branch() {
    local target_branch=$1
    local current_branch=$(git branch --show-current)
    
    if [ "$current_branch" != "$target_branch" ]; then
        print_error "You must be on the $target_branch branch to run this command"
        print_status "Current branch: $current_branch"
        print_status "Please run: git checkout $target_branch"
        exit 1
    fi
}

# Function to check if there are uncommitted changes
check_clean_working_tree() {
    if ! git diff-index --quiet HEAD --; then
        print_error "You have uncommitted changes. Please commit or stash them first."
        git status --short
        exit 1
    fi
}

# Function to deploy to development
deploy_dev() {
    print_status "Deploying to development environment..."
    
    check_branch "dev"
    check_clean_working_tree
    
    # Pull latest changes
    print_status "Pulling latest changes from dev branch..."
    git pull origin dev
    
    # Run tests and linting
    print_status "Running linting..."
    npm run lint
    
    print_status "Building application..."
    npm run build
    
    # Push to trigger Vercel deployment
    print_status "Pushing to dev branch to trigger Vercel deployment..."
    git push origin dev
    
    print_success "Development deployment triggered!"
    print_status "Check your Vercel dashboard for deployment status"
}

# Function to deploy to production
deploy_prod() {
    print_status "Deploying to production environment..."
    
    check_branch "dev"
    check_clean_working_tree
    
    # Switch to main branch
    print_status "Switching to main branch..."
    git checkout main
    
    # Pull latest changes
    print_status "Pulling latest changes from main branch..."
    git pull origin main
    
    # Merge dev into main
    print_status "Merging dev branch into main..."
    git merge dev --no-ff -m "Deploy to production: $(date)"
    
    # Push to trigger production deployment
    print_status "Pushing to main branch to trigger production deployment..."
    git push origin main
    
    # Switch back to dev branch
    print_status "Switching back to dev branch..."
    git checkout dev
    
    print_success "Production deployment triggered!"
    print_status "Check your Vercel dashboard for deployment status"
}

# Function to show help
show_help() {
    echo "AutoAssist Deployment Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  dev     Deploy to development environment (dev branch)"
    echo "  prod    Deploy to production environment (merge dev -> main)"
    echo "  help    Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 dev     # Deploy current dev branch to development"
    echo "  $0 prod    # Merge dev to main and deploy to production"
}

# Main script logic
case "${1:-help}" in
    "dev")
        deploy_dev
        ;;
    "prod")
        deploy_prod
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
