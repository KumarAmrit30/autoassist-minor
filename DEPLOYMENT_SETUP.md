# 🚀 AutoAssist Deployment Setup

This document provides a quick reference for the modern dev/prod deployment workflow set up for AutoAssist.

## Quick Commands

```bash
# Deploy to development
npm run deploy:dev

# Deploy to production  
npm run deploy:prod

# Show deployment help
npm run deploy:help
```

## Branch Strategy

- **`dev`** → Development environment (preview deployments)
- **`main`** → Production environment (live deployments)
- **Feature branches** → Create from `dev` for new features

## Workflow

1. **Development**: Work on `dev` branch → Automatic preview deployment
2. **Production**: Merge `dev` to `main` → Automatic production deployment

## Vercel Setup Required

### 1. Connect Repository
- Link your GitHub repository to Vercel
- Ensure both `dev` and `main` branches are connected

### 2. Environment Variables
Set these in Vercel Dashboard:

**Production** (main branch):
```
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/DATABASE_PROD
NODE_ENV=production
NEXT_PUBLIC_APP_ENV=production
```

**Preview** (dev branch):
```
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/DATABASE_DEV
NODE_ENV=development
NEXT_PUBLIC_APP_ENV=preview
```

### 3. GitHub Actions (Optional)
Add these secrets to your GitHub repository:
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID` 
- `VERCEL_PROJECT_ID`

## Files Created

- `deploy.sh` - Deployment script
- `.github/workflows/deploy.yml` - GitHub Actions workflow
- `vercel.json` - Updated Vercel configuration
- `env.example` - Environment variables template
- `DEPLOYMENT.md` - Complete deployment guide

## Next Steps

1. Set up environment variables in Vercel dashboard
2. Test deployment with `npm run deploy:dev`
3. When ready, deploy to production with `npm run deploy:prod`

For detailed instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).
