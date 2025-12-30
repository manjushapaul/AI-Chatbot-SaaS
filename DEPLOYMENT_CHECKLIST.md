# ✅ Quick Deployment Checklist

## 🚀 Pre-Deployment (GitHub)
- [x] Code pushed to GitHub
- [x] All changes committed
- [x] Latest commit: `8801bba`

## 🔧 Vercel Setup

### Step 1: Connect Repository
- [ ] Sign in to [vercel.com](https://vercel.com)
- [ ] Click "Add New Project"
- [ ] Import `AI-Chatbot-SaaS` repository
- [ ] Framework: Next.js (auto-detected)

### Step 2: Environment Variables
Add these in Vercel Dashboard → Settings → Environment Variables:

#### 🔴 CRITICAL (Required)
- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `NEXTAUTH_URL` - Your Vercel app URL (e.g., `https://your-app.vercel.app`)
- [ ] `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
- [ ] `OPENAI_API_KEY` - From OpenAI dashboard
- [ ] `PINECONE_API_KEY` - From Pinecone dashboard
- [ ] `PINECONE_ENVIRONMENT` - Your Pinecone environment
- [ ] `PINECONE_INDEX_NAME` - Your Pinecone index name

#### 🟡 IMPORTANT (For Payments)
- [ ] `STRIPE_SECRET_KEY` - From Stripe dashboard
- [ ] `STRIPE_PUBLISHABLE_KEY` - From Stripe dashboard
- [ ] `STRIPE_WEBHOOK_SECRET` - After webhook setup
- [ ] `STRIPE_STARTER_PRICE_ID` - Create in Stripe
- [ ] `STRIPE_PROFESSIONAL_PRICE_ID` - Create in Stripe
- [ ] `STRIPE_ENTERPRISE_PRICE_ID` - Create in Stripe

#### 🟢 OPTIONAL (Recommended)
- [ ] `SMTP_HOST` - Email service host
- [ ] `SMTP_PORT` - Email service port
- [ ] `SMTP_USER` - Email service username
- [ ] `SMTP_PASSWORD` - Email service password
- [ ] `JWT_SECRET` - Generate random secret
- [ ] `ENCRYPTION_KEY` - Generate random key (32 chars)

### Step 3: Database Setup
- [ ] Create PostgreSQL database (Vercel Postgres, Neon, or Supabase)
- [ ] Copy connection string
- [ ] Add to `DATABASE_URL` environment variable
- [ ] Database migrations will run automatically on first deploy

### Step 4: Deploy
- [ ] Click "Deploy" button
- [ ] Wait for build to complete (~5-10 minutes)
- [ ] Check build logs for errors

### Step 5: Post-Deployment
- [ ] Verify app loads at `https://your-app.vercel.app`
- [ ] Test signup/signin
- [ ] Create a test bot
- [ ] Upload a test document
- [ ] Test chat functionality

### Step 6: Stripe Webhook
- [ ] Go to Stripe Dashboard → Webhooks
- [ ] Add endpoint: `https://your-app.vercel.app/api/webhooks/stripe`
- [ ] Select events: `customer.subscription.*`, `invoice.payment.*`
- [ ] Copy webhook secret
- [ ] Add to `STRIPE_WEBHOOK_SECRET` in Vercel

## 🎯 Quick Commands Reference

### Generate Secrets
```bash
# NEXTAUTH_SECRET
openssl rand -base64 32

# JWT_SECRET
openssl rand -base64 32

# ENCRYPTION_KEY (32 characters)
openssl rand -hex 16
```

### Test Database Connection
```bash
npx prisma db pull
```

### Run Migrations Locally (if needed)
```bash
npx prisma migrate deploy
```

## 📝 Notes
- Vercel automatically runs `prisma generate` via `postinstall` script
- Database migrations run automatically via `build` script
- All environment variables are encrypted in Vercel
- Preview deployments use same environment variables

## 🆘 If Build Fails
1. Check Vercel build logs
2. Verify all required environment variables are set
3. Ensure `DATABASE_URL` is correct and accessible
4. Check Prisma schema is valid: `npx prisma validate`

