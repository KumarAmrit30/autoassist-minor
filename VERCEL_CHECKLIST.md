# ✅ Vercel Setup Checklist

Complete these steps in your Vercel Dashboard to set up dev/prod environments:

## 🎯 Quick Setup Steps

### 1. Environment Variables Setup

Go to **Vercel Dashboard** → **Your Project** → **Settings** → **Environment Variables**

#### Production Environment
Add these variables and set **Environment** to **Production**:

```
MONGODB_URI=mongodb+srv://iamritkumar30_db_user:K33mdccAhbk5WSGJ@cluster0.b4jojkj.mongodb.net/autoassist_prod
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=[Generate new - see below]
JWT_SECRET=[Generate new - see below]
JWT_REFRESH_SECRET=[Generate new - see below]
NODE_ENV=production
NEXT_PUBLIC_APP_ENV=production
```

#### Preview Environment  
Add these variables and set **Environment** to **Preview**:

```
MONGODB_URI=mongodb+srv://iamritkumar30_db_user:K33mdccAhbk5WSGJ@cluster0.b4jojkj.mongodb.net/autoassist_dev
NEXTAUTH_URL=https://dev.yourdomain.com
NEXTAUTH_SECRET=your-nextauth-secret-key-here
JWT_SECRET=d2f67ea2b6e7cf627d2ef988b746219e50252c1544d0a40414c5898b8d9584ea5cc9d1b91bf2e45a29801c026a4f5fe9ef02b4b94b8e1cfb1d43107b14e6d3af
JWT_REFRESH_SECRET=6fdf99a2d42dcc5a52184f5bd49bcc864a90a2b6a882d40d72a479a47c642ec50c78a7aa511909e4daee511da5c2099922ba7ebd3857ea0e214f528394527e32
NODE_ENV=development
NEXT_PUBLIC_APP_ENV=preview
```

### 2. Generate Production Secrets

Run this command to generate secure secrets for production:

```bash
npm run generate:secrets
```

Copy the generated secrets to your Vercel Production environment variables.

### 3. Domain Configuration (Optional)

If you have a custom domain:

**Vercel Dashboard** → **Your Project** → **Settings** → **Domains**

- Add `yourdomain.com` → Assign to `main` branch
- Add `dev.yourdomain.com` → Assign to `dev` branch

### 4. MongoDB Database Setup

Create two separate databases in MongoDB Atlas:

- **Production**: `autoassist_prod`
- **Development**: `autoassist_dev`

### 5. Local Development Setup

```bash
# Set up local environment
npm run setup:env

# Edit .env.local with your values
# Then start development
npm run dev
```

## 🔄 Deployment Workflow

```bash
# Development deployment
npm run deploy:dev

# Production deployment  
npm run deploy:prod
```

## ✅ Verification

After setup, verify:

- [ ] Environment variables are set in Vercel
- [ ] Production secrets are different from development
- [ ] MongoDB databases are separate for dev/prod
- [ ] Domains are configured (if using custom domains)
- [ ] Local development works with `npm run dev`
- [ ] Dev deployment works with `npm run deploy:dev`
- [ ] Production deployment works with `npm run deploy:prod`

## 🆘 Need Help?

- 📖 **Full Guide**: See `VERCEL_SETUP.md`
- 🚀 **Deployment**: See `DEPLOYMENT.md`
- 🔧 **Scripts**: Run `npm run deploy:help`

---

**🎉 Once complete, you'll have a professional dev/prod setup with automatic deployments!**
