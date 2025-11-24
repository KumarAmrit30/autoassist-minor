# 🚀 Vercel Setup Guide for Dev/Prod Environments

This guide will help you configure your Vercel project to have separate development and production environments with custom domains.

## 📋 Prerequisites

- Vercel project already created and connected to GitHub
- Custom domain purchased (optional but recommended)
- MongoDB database with separate databases for dev and prod

## 🌐 Step 1: Configure Domains in Vercel

### Option A: Using Custom Domains (Recommended)

1. **Go to Vercel Dashboard** → Your Project → **Settings** → **Domains**

2. **Add Production Domain:**
   - Add your main domain: `yourdomain.com`
   - Set it to deploy from: **`main` branch**

3. **Add Development Domain:**
   - Add your dev subdomain: `dev.yourdomain.com`
   - Set it to deploy from: **`dev` branch**

### Option B: Using Vercel Subdomains (Free Alternative)

If you don't have a custom domain, Vercel provides automatic URLs:
- **Production**: `your-project-name.vercel.app` (main branch)
- **Development**: `your-project-name-git-dev.vercel.app` (dev branch)

## ⚙️ Step 2: Configure Environment Variables

### 🔴 Production Environment Variables

Go to **Settings** → **Environment Variables** and add these for **Production**:

```bash
# Environment: Production
MONGODB_URI=mongodb+srv://iamritkumar30_db_user:K33mdccAhbk5WSGJ@cluster0.b4jojkj.mongodb.net/autoassist_prod
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-production-nextauth-secret-key-here
JWT_SECRET=generate-new-production-jwt-secret-here
JWT_REFRESH_SECRET=generate-new-production-jwt-refresh-secret-here
NODE_ENV=production
NEXT_PUBLIC_APP_ENV=production
```

### 🟡 Preview Environment Variables

Add these for **Preview** (dev branch and PRs):

```bash
# Environment: Preview
MONGODB_URI=mongodb+srv://iamritkumar30_db_user:K33mdccAhbk5WSGJ@cluster0.b4jojkj.mongodb.net/autoassist_dev
NEXTAUTH_URL=https://dev.yourdomain.com
NEXTAUTH_SECRET=your-nextauth-secret-key-here
JWT_SECRET=d2f67ea2b6e7cf627d2ef988b746219e50252c1544d0a40414c5898b8d9584ea5cc9d1b91bf2e45a29801c026a4f5fe9ef02b4b94b8e1cfb1d43107b14e6d3af
JWT_REFRESH_SECRET=6fdf99a2d42dcc5a52184f5bd49bcc864a90a2b6a882d40d72a479a47c642ec50c78a7aa511909e4daee511da5c2099922ba7ebd3857ea0e214f528394527e32
NODE_ENV=development
NEXT_PUBLIC_APP_ENV=preview
```

## 📊 Step 3: MongoDB Database Setup

### Create Separate Databases

1. **Production Database**: `autoassist_prod`
2. **Development Database**: `autoassist_dev`

### Update MongoDB Connection Strings

- **Production**: `...mongodb.net/autoassist_prod`
- **Development**: `...mongodb.net/autoassist_dev`

## 🔧 Step 4: Vercel Project Settings

### Git Integration Settings

1. Go to **Settings** → **Git**
2. Ensure **Automatic Deployments** is enabled
3. **Production Branch**: Set to `main`
4. **Allowed Branches**: Enable deployments for `dev` branch

### Build Settings

Verify these are set correctly:
- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

## 🛡️ Step 5: Security Configuration

### Generate New Production Secrets

**⚠️ IMPORTANT**: Never use the same secrets in production as development!

Generate new secrets for production:

```bash
# Generate new JWT secrets for production
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Run this twice to get:
1. New `JWT_SECRET` for production
2. New `JWT_REFRESH_SECRET` for production

## 🔄 Step 6: Deployment Workflow

### Development Deployment
```bash
# Work on dev branch
git checkout dev
git add .
git commit -m "feature: your changes"
git push origin dev
# ✅ Automatically deploys to dev.yourdomain.com
```

### Production Deployment
```bash
# Use the deployment script
npm run deploy:prod
# ✅ Automatically merges dev → main and deploys to yourdomain.com
```

## 📱 Step 7: Test Your Setup

### Test Development Environment
1. Visit `https://dev.yourdomain.com`
2. Check that it connects to `autoassist_dev` database
3. Verify NextAuth works with dev URL

### Test Production Environment
1. Visit `https://yourdomain.com`
2. Check that it connects to `autoassist_prod` database
3. Verify NextAuth works with production URL

## 🔍 Step 8: Verification Checklist

- [ ] **Domains**: Both dev and prod domains are configured and working
- [ ] **Environment Variables**: All variables are set correctly for each environment
- [ ] **Database**: Separate databases for dev (`autoassist_dev`) and prod (`autoassist_prod`)
- [ ] **NextAuth**: URLs are correctly set for each environment
- [ ] **JWT Secrets**: Different secrets for production
- [ ] **Deployments**: Both dev and prod deployments are working
- [ ] **Branch Strategy**: `dev` → preview, `main` → production

## 🚨 Troubleshooting

### Common Issues:

**Environment Variables Not Working:**
- Ensure variables are assigned to correct environment (Production vs Preview)
- Check variable names match exactly (case-sensitive)
- Redeploy after adding new variables

**NextAuth Errors:**
- Verify `NEXTAUTH_URL` matches your domain exactly
- Ensure `NEXTAUTH_SECRET` is set and different for each environment
- Check that domains are properly configured in Vercel

**Database Connection Issues:**
- Verify MongoDB connection strings are correct
- Ensure MongoDB Atlas allows connections from `0.0.0.0/0`
- Check that database names are different for dev/prod

**Domain Issues:**
- Verify DNS settings for custom domains
- Check SSL certificates are properly configured
- Ensure domains are assigned to correct branches

## 📞 Getting Help

If you encounter issues:

1. Check Vercel deployment logs in the dashboard
2. Verify environment variables in Vercel settings
3. Test MongoDB connections using MongoDB Compass
4. Review NextAuth configuration documentation

---

**🎉 Once completed, you'll have a professional dev/prod setup with:**
- ✅ Separate domains for development and production
- ✅ Environment-specific databases and configurations
- ✅ Automatic deployments from Git branches
- ✅ Secure, separate authentication secrets
- ✅ Easy deployment workflow with npm scripts
