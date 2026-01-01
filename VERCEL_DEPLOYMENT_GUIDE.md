# 🚀 Vercel Deployment Guide for AI ChatBot SaaS

## ✅ Step 1: Push to GitHub (COMPLETED)
- ✅ Code pushed to: `https://github.com/manjushapaul/AI-Chatbot-SaaS.git`
- ✅ Latest commit: `8801bba` (hydration fix)

---

## 📋 Step 2: Prerequisites Setup

### 2.1 Required Services
Before deploying, ensure you have accounts for:
- ✅ **Vercel** (for hosting)
- ✅ **PostgreSQL Database** (Vercel Postgres, Neon, Supabase, or Railway)
- ✅ **OpenAI** (for AI chat functionality)
- ✅ **Pinecone** (for vector embeddings)
- ✅ **Stripe** (for payments - optional but recommended)
- ✅ **Email Service** (Gmail SMTP or SendGrid - for notifications)

---

## 🔧 Step 3: Vercel Deployment

### 3.1 Connect Repository to Vercel
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New Project"**
3. Import your GitHub repository: `AI-Chatbot-SaaS`
4. Vercel will auto-detect Next.js settings

### 3.2 Configure Build Settings
- **Framework Preset**: Next.js (auto-detected)
- **Root Directory**: `./` (root)
- **Build Command**: `npm run build` (default)
- **Output Directory**: `.next` (default)
- **Install Command**: `npm install` (default)

### 3.3 Environment Variables
Add ALL these environment variables in Vercel Dashboard → Settings → Environment Variables:

#### 🔐 Required Environment Variables

```bash
# Database (PostgreSQL)
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"

# NextAuth.js
NEXTAUTH_URL="https://your-app.vercel.app"
NEXTAUTH_SECRET="generate-a-random-secret-here-min-32-chars"

# OpenAI
OPENAI_API_KEY="sk-..."

# Pinecone (Vector Database)
PINECONE_API_KEY="your-pinecone-api-key"
PINECONE_ENVIRONMENT="your-pinecone-environment"
PINECONE_INDEX_NAME="ai-chatbot-embeddings"

# Stripe (for payments)
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Stripe Price IDs (create in Stripe Dashboard)
STRIPE_STARTER_PRICE_ID="price_..."
STRIPE_PROFESSIONAL_PRICE_ID="price_..."
STRIPE_ENTERPRISE_PRICE_ID="price_..."
```

#### 📧 Optional but Recommended

```bash
# Email (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"

# AWS S3 (for file uploads)
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="your-s3-bucket-name"

# Redis (optional, for caching)
REDIS_URL="redis://..."

# Analytics (optional)
GOOGLE_ANALYTICS_ID="G-..."
```

#### 🔒 Security
```bash
JWT_SECRET="generate-random-secret"
ENCRYPTION_KEY="generate-random-key-32-chars"
```

---

## 🗄️ Step 4: Database Setup

### 4.1 Create PostgreSQL Database
**Option A: Vercel Postgres (Recommended)**
1. In Vercel Dashboard → Storage → Create Database
2. Select **Postgres**
3. Copy the `DATABASE_URL` connection string
4. Add to environment variables

**Option B: External Database (Neon, Supabase, Railway)**
1. Create a PostgreSQL database
2. Get connection string
3. Add `DATABASE_URL` to Vercel environment variables

### 4.2 Run Database Migrations
After deployment, you need to run Prisma migrations:

**Option 1: Via Vercel Build Command (Recommended)**
Add to `package.json`:
```json
{
  "scripts": {
    "postinstall": "prisma generate",
    "vercel-build": "prisma generate && prisma migrate deploy && next build"
  }
}
```

**Option 2: Manual Migration**
1. SSH into Vercel or use Vercel CLI:
```bash
npx vercel env pull .env.local
npx prisma migrate deploy
```

---

## 🚀 Step 5: Deploy

### 5.1 Initial Deployment
1. Click **"Deploy"** in Vercel
2. Wait for build to complete (5-10 minutes)
3. Check build logs for errors

### 5.2 Post-Deployment Checklist

#### ✅ Verify Deployment
- [ ] App loads at `https://your-app.vercel.app`
- [ ] No build errors in Vercel logs
- [ ] Database connection successful

#### ✅ Test Core Features
- [ ] Sign up / Sign in works
- [ ] Create a bot
- [ ] Upload knowledge base documents
- [ ] Test chat functionality
- [ ] Check analytics page

#### ✅ Configure Stripe Webhook
1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://your-app.vercel.app/api/webhooks/stripe`
3. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy webhook secret → Add to `STRIPE_WEBHOOK_SECRET` in Vercel

---

## 🔍 Step 6: Troubleshooting

### Common Issues

#### ❌ Build Fails: "Prisma Client not generated"
**Fix**: Add to `package.json`:
```json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

#### ❌ Database Connection Error
**Fix**: 
- Verify `DATABASE_URL` is correct
- Ensure database allows connections from Vercel IPs
- Check SSL mode: `?sslmode=require` at end of connection string

#### ❌ NextAuth Error: "NEXTAUTH_SECRET is not set"
**Fix**: Generate a secret:
```bash
openssl rand -base64 32
```
Add to `NEXTAUTH_SECRET` in Vercel

#### ❌ API Routes Return 500
**Fix**: 
- Check Vercel function logs
- Verify all environment variables are set
- Check database migrations ran successfully

---

## 📝 Step 7: Custom Domain (Optional)

1. Go to Vercel Dashboard → Settings → Domains
2. Add your custom domain
3. Update `NEXTAUTH_URL` to your custom domain
4. Configure DNS records as instructed

---

## 🔄 Step 8: Continuous Deployment

Vercel automatically deploys on every push to `main` branch:
- ✅ Push to GitHub → Auto-deploy to Vercel
- ✅ Preview deployments for pull requests
- ✅ Production deployments for `main` branch

---

## 📊 Step 9: Monitoring

### Vercel Analytics
- Enable in Vercel Dashboard → Analytics
- Monitor performance, errors, and usage

### Application Monitoring
- Check Vercel Function Logs for API errors
- Monitor database connections
- Track API usage in your dashboard

---

## ✅ Final Checklist

Before going live:
- [ ] All environment variables configured
- [ ] Database migrations completed
- [ ] Stripe webhook configured
- [ ] Test signup/signin flow
- [ ] Test bot creation
- [ ] Test knowledge base upload
- [ ] Test chat functionality
- [ ] Test payment flow (if enabled)
- [ ] Custom domain configured (if needed)
- [ ] Analytics enabled
- [ ] Error monitoring set up

---

## 🆘 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check Vercel function logs
3. Verify all environment variables
4. Test database connection
5. Review Prisma schema and migrations

---

## 🎉 Success!

Once deployed, your chatbot will be fully functional at:
**https://your-app.vercel.app**


