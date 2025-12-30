# 🗄️ Supabase Database Setup Guide

## Step-by-Step: Create PostgreSQL Database in Supabase

### Step 1: Sign Up / Sign In to Supabase

1. Go to [supabase.com](https://supabase.com)
2. Click **"Start your project"** or **"Sign in"**
3. Sign in with:
   - GitHub (recommended)
   - Google
   - Email

---

### Step 2: Create a New Project

1. After signing in, you'll see your dashboard
2. Click **"New Project"** button (top right or center)
3. Fill in the project details:

   **Project Details:**
   - **Name:** `ai-chatbot-saas` (or any name you prefer)
   - **Database Password:** 
     - Click "Generate a password" or create your own
     - **⚠️ IMPORTANT:** Save this password! You'll need it for the connection string
     - Make it strong (at least 12 characters, mix of letters, numbers, symbols)
   - **Region:** Choose closest to your users
     - Examples: `US East (North Virginia)`, `EU West (Ireland)`, `Asia Pacific (Singapore)`
   - **Pricing Plan:** Select **Free** (for development/testing)

4. Click **"Create new project"**
5. Wait 2-3 minutes for Supabase to set up your database

---

### Step 3: Get Your Database Connection String

**Your Project Reference ID:** `kxnjpnjoqugschuyoibk`

#### Option A: Find in Supabase Dashboard (Recommended)

1. In your Supabase dashboard, go to **Settings** (gear icon in left sidebar)
2. Click **Database** (under CONFIGURATION section)
3. Scroll down to the **very bottom** of the page
4. Look for **"Connection string"** or **"Connection info"** section
5. You should see tabs like: **URI**, **JDBC**, **Node.js**, etc.
6. Click the **"URI"** tab
7. Copy the connection string shown

**If you still can't find it, use Option B below.**

#### Option B: Construct It Manually (Easier!)

Since you have your project reference ID (`kxnjpnjoqugschuyoibk`), you can build it:

**Step 1: Get your database password**
- This is the password you set when creating the Supabase project
- If you forgot: Settings → Database → "Reset database password"

**Step 2: Build the connection string**

**For Vercel (Use Pooled Connection - Recommended):**
```
postgresql://postgres.kxnjpnjoqugschuyoibk:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

**Direct Connection (Alternative):**
```
postgresql://postgres:[YOUR-PASSWORD]@db.kxnjpnjoqugschuyoibk.supabase.co:5432/postgres

postgresql://postgres:v1cUCTr56KK5tOcY@db.qacwenfcjjuaneyibiad.supabase.co:5432/postgres

```

**Replace `[YOUR-PASSWORD]` with your actual database password.**

**Example (if your password is `MyPass123!`):**
```
postgresql://postgres.kxnjpnjoqugschuyoibk:MyPass123!@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

**Note:** The region might be different. Common regions:
- `us-east-1` (US East)
- `us-west-1` (US West)
- `eu-west-1` (Europe)
- `ap-southeast-1` (Asia Pacific)

Check your project region in: Settings → General → Region

---

### Step 4: Add Connection Pooling (Recommended for Vercel)

For better performance with Vercel serverless functions:

1. In the same **Database** settings page
2. Scroll to **Connection pooling** section
3. Find **"Session mode"** connection string
4. Copy this connection string instead (it uses port `6543` instead of `5432`)

**Pooled connection string format:**
```
postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

**Why use pooling?**
- Better for serverless functions (Vercel)
- Handles connection limits better
- More efficient for high-traffic apps

---

### Step 5: Add to Vercel Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Add:
   - **Key:** `DATABASE_URL`
   - **Value:** Paste your Supabase connection string
   - **Environment:** Select all (Production, Preview, Development)
6. Click **Save**

---

### Step 6: Test Database Connection

After adding to Vercel, test the connection:

**Option 1: Via Vercel Build**
- Deploy your app
- Check build logs for database connection errors

**Option 2: Via Prisma Studio (Local)**
```bash
# In your local project
npx prisma studio
```

**Option 3: Via Supabase SQL Editor**
1. Go to Supabase Dashboard → **SQL Editor**
2. Run a test query:
   ```sql
   SELECT version();
   ```

---

## 🔐 Security Best Practices

### 1. Use Connection Pooling
- Always use the pooled connection string for production
- Better performance and connection management

### 2. Keep Password Secure
- Never commit passwords to Git
- Store only in Vercel environment variables
- Use different passwords for dev/staging/production

### 3. Enable Row Level Security (RLS)
- Supabase has built-in RLS
- Configure in Supabase Dashboard → Authentication → Policies

---

## 📊 Supabase Dashboard Overview

After creating your project, you'll have access to:

1. **Table Editor** - Visual database management
2. **SQL Editor** - Run SQL queries
3. **Authentication** - User management
4. **Storage** - File storage (if needed)
5. **API** - Auto-generated REST API
6. **Settings** - Database, API keys, etc.

---

## 🗄️ Run Prisma Migrations

After setting up Supabase, you need to run your Prisma migrations:

### Option 1: Via Vercel (Automatic)
- Your `package.json` already includes `prisma migrate deploy` in build
- Migrations run automatically on deployment

### Option 2: Manual (Local)
```bash
# Pull environment variables
npx vercel env pull .env.local

# Run migrations
npx prisma migrate deploy

# Or push schema (if starting fresh)
npx prisma db push
```

---

## 🆘 Troubleshooting

### "Connection refused" Error
- **Check:** Password is correct in connection string
- **Check:** Database is fully provisioned (wait 2-3 minutes)
- **Check:** Connection string format is correct

### "Too many connections" Error
- **Solution:** Use connection pooling (port 6543)
- **Solution:** Check Supabase dashboard for active connections

### "SSL required" Error
- **Solution:** Add `?sslmode=require` to connection string:
  ```
  postgresql://...@...supabase.co:5432/postgres?sslmode=require
  ```

### Can't Find Connection String
- **Location:** Settings → Database → Connection string section
- **Make sure:** You're in the correct project

---

## 💰 Supabase Free Tier Limits

- **Database Size:** 500 MB
- **Bandwidth:** 5 GB/month
- **API Requests:** 50,000/month
- **File Storage:** 1 GB
- **Database Connections:** Limited (use pooling!)

**For production:** Consider upgrading to Pro plan ($25/month)

---

## ✅ Checklist

- [ ] Created Supabase account
- [ ] Created new project
- [ ] Saved database password securely
- [ ] Copied connection string (URI format)
- [ ] Added `DATABASE_URL` to Vercel environment variables
- [ ] Tested connection (via build or Prisma Studio)
- [ ] Ran Prisma migrations

---

## 🔗 Quick Links

- [Supabase Dashboard](https://app.supabase.com)
- [Supabase Documentation](https://supabase.com/docs)
- [Connection Pooling Guide](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [Supabase Pricing](https://supabase.com/pricing)

---

## 📝 Example Connection Strings

### Direct Connection (Port 5432)
```
postgresql://postgres:YourPassword123!@db.abcdefghijklmnop.supabase.co:5432/postgres?sslmode=require
```

### Pooled Connection (Port 6543) - Recommended
```
postgresql://postgres.abcdefghijklmnop:YourPassword123!@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require
```

**Note:** Replace `YourPassword123!` with your actual password and `abcdefghijklmnop` with your actual project reference.

