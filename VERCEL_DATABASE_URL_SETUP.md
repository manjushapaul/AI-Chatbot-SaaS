# 🔧 Add DATABASE_URL to Vercel - Step by Step

## ✅ Build Script Already Updated

Your `package.json` has been updated to skip migrations:
```json
"build": "prisma generate && next build"
```

This means:
- ✅ Prisma Client will be generated (works with pooled connection)
- ✅ Next.js app will build
- ❌ Migrations are skipped (you'll run them manually in Supabase)

---

## 📝 Step-by-Step: Add DATABASE_URL to Vercel

### Step 1: Go to Vercel Environment Variables

1. Go to your Vercel project:
   - URL: https://vercel.com/manjusha-pauls-projects/ai-chatbot-saa-s-9s6o/settings/environment-variables
   - Or: Vercel Dashboard → Your Project → **Settings** → **Environment Variables**

### Step 2: Add or Update DATABASE_URL

**If DATABASE_URL doesn't exist:**
1. Click **"Add New"** button (top right)
2. Fill in:
   - **Key:** `DATABASE_URL`
   - **Value:** `postgresql://postgres.qacwenfcjjuaneyibiad:TjFsJ1mQb2IxXhxe@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require`
   - **Environment:** Select all three checkboxes:
     - ☑ Production
     - ☑ Preview  
     - ☑ Development
3. Click **"Save"**

**If DATABASE_URL already exists:**
1. Find `DATABASE_URL` in the list
2. Click **"Edit"** (or the pencil icon)
3. Replace the value with:
   ```
   postgresql://postgres.qacwenfcjjuaneyibiad:TjFsJ1mQb2IxXhxe@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require
   ```
4. Make sure all environments are selected
5. Click **"Save"**

---

## ✅ Verify Other Environment Variables

While you're there, make sure these are also set:

### Required:
- [ ] `DATABASE_URL` - ✅ (you're adding this now)
- [ ] `NEXTAUTH_SECRET` - Should be set
- [ ] `NEXTAUTH_URL` - Should be set (your Vercel app URL)

### For AI Features (if you added them):
- [ ] `OPENAI_API_KEY` - Optional (if using AI chat)
- [ ] `PINECONE_API_KEY` - Optional (if using embeddings)
- [ ] `PINECONE_ENVIRONMENT` - Optional
- [ ] `PINECONE_INDEX_NAME` - Optional

---

## 🚀 After Adding DATABASE_URL

### Step 1: Run Migrations in Supabase First

**IMPORTANT:** Before deploying, run the SQL migration in Supabase:

1. Go to Supabase SQL Editor
2. Open the file: `supabase-complete-migration.sql`
3. Copy the entire SQL
4. Paste and run in Supabase SQL Editor
5. Verify tables were created

### Step 2: Deploy to Vercel

1. Go to Vercel → **Deployments**
2. Click **"Redeploy"** on the latest deployment
3. Or push a new commit to trigger auto-deployment

### Step 3: Check Build Logs

During deployment, check the build logs:
- ✅ Should see: "Prisma generate" - succeeds
- ✅ Should see: "Next build" - succeeds
- ❌ Should NOT see: "prisma migrate deploy" (it's removed from build)

---

## 📋 Quick Checklist

- [ ] Added `DATABASE_URL` to Vercel environment variables
- [ ] Used pooled connection string (port 6543)
- [ ] Selected all environments (Production, Preview, Development)
- [ ] Ran SQL migrations in Supabase SQL Editor first
- [ ] Verified tables exist in Supabase Table Editor
- [ ] Redeployed to Vercel
- [ ] Checked build logs - build succeeds

---

## 🎯 What Happens During Build

1. **Install dependencies** - `npm install`
2. **Generate Prisma Client** - `prisma generate` ✅ (works with pooled connection)
3. **Build Next.js app** - `next build` ✅
4. **Deploy** - App goes live ✅

**Migrations are NOT run** - You already ran them manually in Supabase!

---

## 🆘 If Build Still Fails

### Check Build Logs for:
- "Cannot find module '@prisma/client'" - Prisma generate failed
- "Database connection error" - DATABASE_URL might be wrong
- "Table does not exist" - Migrations weren't run in Supabase

### Common Fixes:
1. **Verify DATABASE_URL** is correct in Vercel
2. **Check migrations ran** in Supabase (Table Editor should show tables)
3. **Clear Vercel build cache** - Settings → General → Clear cache

---

## ✅ Success Indicators

When everything works:
- ✅ Build completes successfully
- ✅ App is accessible at your Vercel URL
- ✅ No database connection errors
- ✅ Tables exist in Supabase

---

**🎯 The key steps are:**
1. Add `DATABASE_URL` to Vercel (pooled connection)
2. Run SQL migrations in Supabase first
3. Deploy to Vercel
4. Build should succeed!



