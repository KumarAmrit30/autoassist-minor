# AutoAssist Deployment Guide

## 🚀 Modern Dev/Prod Deployment Workflow

This project uses a modern deployment strategy with separate development and production environments using Vercel's automatic deployment features.

### Branch Strategy

- **`dev` branch**: Development environment with preview deployments
- **`main` branch**: Production environment with live deployments
- **Feature branches**: Create from `dev` branch for new features

### Deployment Workflow

```mermaid
graph LR
    A[Feature Branch] --> B[dev branch]
    B --> C[Preview Deployment]
    B --> D[main branch]
    D --> E[Production Deployment]
```

## 🛠️ Quick Start

### 1. Development Deployment
```bash
# Make sure you're on dev branch
git checkout dev

# Deploy to development environment
npm run deploy:dev
```

### 2. Production Deployment
```bash
# Make sure you're on dev branch
git checkout dev

# Deploy to production (merges dev -> main)
npm run deploy:prod
```

### 3. Manual Deployment Commands
```bash
# Using the deployment script
./deploy.sh dev     # Deploy to development
./deploy.sh prod    # Deploy to production
./deploy.sh help    # Show help
```

## ⚙️ Vercel Configuration

### Automatic Deployments
- **Production**: Automatically deploys when you push to `main` branch
- **Preview**: Automatically deploys when you push to `dev` branch or any other branch
- **Pull Requests**: Creates preview deployments for PRs

### Environment Variables Setup

#### In Vercel Dashboard:

1. **Production Environment** (main branch):
   ```bash
   MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/DATABASE_PROD
   AI_API_ENDPOINT=https://your-prod-ai-api-endpoint.com
   AI_API_KEY=your-prod-ai-api-key-here
   NODE_ENV=production
   NEXT_PUBLIC_APP_ENV=production
   ```

2. **Preview Environment** (dev branch and PRs):
   ```bash
   MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/DATABASE_DEV
   AI_API_ENDPOINT=https://your-dev-ai-api-endpoint.com
   AI_API_KEY=your-dev-ai-api-key-here
   NODE_ENV=development
   NEXT_PUBLIC_APP_ENV=preview
   ```

#### Local Development (.env.local):
```bash
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/DATABASE_DEV
AI_API_ENDPOINT=https://your-dev-ai-api-endpoint.com
AI_API_KEY=your-dev-ai-api-key-here
NODE_ENV=development
NEXT_PUBLIC_APP_ENV=development
```

## 🔧 GitHub Actions Workflow

The project includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that:

- Runs on pushes to `main` and `dev` branches
- Runs on pull requests to `main`
- Performs linting and building
- Deploys to appropriate Vercel environments

### Required GitHub Secrets:
- `VERCEL_TOKEN`: Your Vercel API token
- `VERCEL_ORG_ID`: Your Vercel organization ID
- `VERCEL_PROJECT_ID`: Your Vercel project ID

## 📋 Deployment Process

### Development Workflow:
1. Create feature branch from `dev`
2. Make changes and test locally
3. Push to feature branch
4. Create PR to `dev` branch
5. Review and merge to `dev`
6. Automatic preview deployment triggers

### Production Workflow:
1. Ensure `dev` branch is stable and tested
2. Run `npm run deploy:prod` or `./deploy.sh prod`
3. Script automatically:
   - Switches to `main` branch
   - Merges `dev` into `main`
   - Pushes to `main`
   - Triggers production deployment
   - Switches back to `dev`

## 🌐 URLs and Domains

### Automatic URLs:
- **Production**: `https://your-project.vercel.app`
- **Preview**: `https://your-project-git-dev.vercel.app`
- **Feature branches**: `https://your-project-git-feature-branch.vercel.app`

### Custom Domains (Optional):
- **Production**: `https://yourdomain.com`
- **Development**: `https://dev.yourdomain.com`

## 🔍 Monitoring and Verification

### Post-Deployment Checklist:
- [ ] Homepage loads correctly
- [ ] Car data fetches from correct database
- [ ] Images load properly
- [ ] Navigation works smoothly
- [ ] Responsive design on mobile
- [ ] API endpoints respond correctly
- [ ] Environment variables are correctly set

### Performance Metrics:
- **First Load JS**: ~171 kB
- **Build Time**: ~2-3 seconds
- **API Response**: <500ms for car data
- **Lighthouse Score**: 90+ across all metrics

## 🚨 Troubleshooting

### Common Issues:

**MongoDB Connection**:
- Ensure IP whitelist includes `0.0.0.0/0` for Vercel
- Verify connection string format
- Check database permissions

**Environment Variables**:
- Double-check all required variables are set in Vercel dashboard
- Ensure variables are assigned to correct environments
- Verify variable names match exactly

**Build Errors**:
- Check build logs in Vercel dashboard
- Run `npm run build` locally to test
- Verify all dependencies are in package.json

**Deployment Script Issues**:
- Ensure you're on the correct branch
- Check for uncommitted changes
- Verify Git remote is configured correctly

### Getting Help:
1. Check Vercel deployment logs
2. Run deployment script with verbose output
3. Test build locally with `npm run build`
4. Verify environment variables in Vercel dashboard

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [GitHub Actions](https://docs.github.com/en/actions)
- [MongoDB Atlas](https://docs.atlas.mongodb.com/)

---

**Note**: This deployment setup provides a modern, automated workflow that ensures reliable deployments while maintaining separation between development and production environments.
