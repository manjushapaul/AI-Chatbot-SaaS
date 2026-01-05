# 🔄 Update to New Supabase Project

## What Changed

You've created a new Supabase project: **AI-Chatbot-SaaS**
- New project = New project reference ID
- Need to update `DATABASE_URL` in Vercel

---

## Step 1: Get Your New Project Details

### 1.1 Get Project Reference ID

1. Go to your Supabase Dashboard
2. Select your new project: **AI-Chatbot-SaaS**
3. Check the URL: `https://app.supabase.com/project/[NEW-PROJECT-REF]`
4. **Copy the project reference ID** (the part after `/project/`)

**Example:** If URL is `https://app.supabase.com/project/abcdefghijklmnop`, then your project reference is `abcdefghijklmnop`

### 1.2 Get Your Region

1. In Supabase Dashboard → Settings → General
2. Check your **Region** (e.g., `us-east-1`, `eu-west-1`, etc.)
3. **Note it down**

### 1.3 Confirm Your Password

- You mentioned it's the same password as before ✅
- Make sure you have it ready

---

## Step 2: Build New Connection String

### Format for Pooled Connection (Recommended for Vercel):

```
postgresql://postgres.[NEW-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require
```

### Replace:
- `[NEW-PROJECT-REF]` = Your new project reference ID
- `[YOUR-PASSWORD]` = Your database password (same as before)
- `[REGION]` = Your region (e.g., `us-east-1`)

### Example:
If your:
- Project Reference: `abcdefghijklmnop`
- Password: `MyPassword123!`
- Region: `us-east-1`

Your connection string would be:
```
postgresql://postgres.abcdefghijklmnop:MyPassword123!@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require
```

---

## Step 3: Update Vercel Environment Variables

### 3.1 Update DATABASE_URL

1. Go to Vercel Dashboard
2. Your Project → **Settings** → **Environment Variables**
3. Find `DATABASE_URL`
4. Click **Edit** (or delete and recreate)
5. Paste your **new connection string** (from Step 2)
6. Make sure **all environments** are selected (Production, Preview, Development)
7. Click **Save**

### 3.2 Verify Other Variables

Check these are still set (they shouldn't need changes):
- ✅ `NEXTAUTH_SECRET` - No change needed
- ✅ `NEXTAUTH_URL` - No change needed
- ✅ `OPENAI_API_KEY` - No change needed (if you added it)
- ✅ `PINECONE_API_KEY` - No change needed (if you added it)
- ✅ `PINECONE_ENVIRONMENT` - No change needed
- ✅ `PINECONE_INDEX_NAME` - No change needed

---

## Step 4: Run Database Migrations

Since this is a **new database**, you need to create all the tables.

### Option A: Automatic (During Vercel Build) ✅ Recommended

Your `package.json` already includes migrations in the build:
```json
"build": "prisma generate && prisma migrate deploy && next build"
```

**Just deploy** - migrations will run automatically!

### Option B: Manual (Local Testing First)

If you want to test locally first:

1. **Create `.env.local`** in your project root:
```bash
DATABASE_URL="postgresql://postgres.[NEW-PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require"
```

2. **Run migrations:**
```bash
npx prisma generate
npx prisma migrate deploy
```

3. **Verify tables were created:**
```bash
npx prisma studio
```

---

## Step 5: Deploy to Vercel

### 5.1 Redeploy

1. Go to Vercel → Your Project → **Deployments**
2. Click **"Redeploy"** on the latest deployment
3. Or push a new commit to trigger auto-deployment

### 5.2 Check Build Logs

1. During deployment, check **Build Logs**
2. Look for:
   - ✅ "Prisma generate" - Should succeed
   - ✅ "Prisma migrate deploy" - Should create all tables
   - ✅ "Next build" - Should complete successfully

### 5.3 Verify Success

After deployment:
- ✅ Build completes without errors
- ✅ App is accessible at your Vercel URL
- ✅ Database tables are created (check Supabase → Table Editor)

---

## Step 6: Verify Database Setup

### Check Tables in Supabase

1. Go to Supabase Dashboard → **Table Editor**
2. You should see all tables:
   - `tenants`
   - `users`
   - `bots`
   - `knowledge_bases`
   - `conversations`
   - `messages`
   - `subscriptions`
   - And more...

### Test Connection

1. Go to Supabase Dashboard → **SQL Editor**
2. Run:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

You should see all your tables listed.

---

## ✅ Checklist

- [ ] Got new project reference ID from Supabase
- [ ] Got region from Supabase settings
- [ ] Built new connection string (pooled, port 6543)
- [ ] Updated `DATABASE_URL` in Vercel
- [ ] Verified other environment variables are still set
- [ ] Deployed/Redeployed to Vercel
- [ ] Checked build logs - migrations ran successfully
- [ ] Verified tables exist in Supabase Table Editor

---

## 🆘 Troubleshooting

### Error: "Can't reach database server"
- **Check:** Connection string format is correct
- **Check:** Using pooled connection (port 6543)
- **Check:** Password is correct
- **Check:** Region matches your Supabase project

### Error: "Migration failed"
- **Check:** Database is accessible
- **Check:** Connection string is correct
- **Check:** Build logs for specific error

### Tables not created
- **Check:** Migrations ran in build logs
- **Check:** No errors during `prisma migrate deploy`
- **Try:** Run migrations manually locally first

---

## 📝 Summary

**What you need to do:**
1. ✅ Get new project reference ID
2. ✅ Build new connection string
3. ✅ Update `DATABASE_URL` in Vercel
4. ✅ Deploy (migrations run automatically)
5. ✅ Verify tables were created

**That's it!** Everything else stays the same.

---

## 🎯 Quick Reference

**New Connection String Format:**
```
postgresql://postgres.[NEW-PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require
```

**Where to update:**
- Vercel → Settings → Environment Variables → `DATABASE_URL`

**What stays the same:**
- All other environment variables
- Your code
- Your GitHub repository

---

**Once you update the `DATABASE_URL` in Vercel and redeploy, everything should work!** 🚀




