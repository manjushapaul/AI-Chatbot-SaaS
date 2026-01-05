# Supabase Database Setup Guide

## ✅ Current Status

Your `.env.local` file has been configured with Supabase connection strings:

```bash
DATABASE_URL="postgresql://postgres.qacwenfcjjuaneyibiad:HS3JcBDUUO6vvqda@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require"
DIRECT_URL="postgresql://postgres.qacwenfcjjuaneyibiad:HS3JcBDUUO6vvqda@db.qacwenfcjjuaneyibiad.supabase.co:5432/postgres?sslmode=require"
```

## 🔍 Database Connection Test

✅ **Connection Status**: Working
- Basic connection successful
- Tables exist in database
- All 16 tables are present

## ⚠️ Authentication Issue

The "Invalid credentials or tenant not found" error can occur if:

1. **No tenants exist** in your Supabase database
2. **No users exist** for the tenant you're trying to log into
3. **Wrong tenant subdomain** entered during sign-in
4. **Password is incorrect** for the user

## 🔧 How to Fix

### Step 1: Verify Your Supabase Connection String

If the password has changed, you need to update it:

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project: `qacwenfcjjuaneyibiad`
3. Go to **Settings** → **Database**
4. Find **Connection Pooling** section
5. Copy the connection strings:

**For DATABASE_URL (Transaction Mode - Port 6543):**
```
postgresql://postgres.qacwenfcjjuaneyibiad:[YOUR-PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require
```

**For DIRECT_URL (Direct Connection - Port 5432):**
```
postgresql://postgres.qacwenfcjjuaneyibiad:[YOUR-PASSWORD]@db.qacwenfcjjuaneyibiad.supabase.co:5432/postgres?sslmode=require
```

### Step 2: Check What's in Your Database

Run this to see what tenants and users exist:

```bash
node scripts/test-db-connection.js
```

### Step 3: Create a Test Account

If no users exist, create one:

```bash
node scripts/setup-test-account.js
```

Or create a user manually:

```bash
node scripts/create-user.js
```

### Step 4: Sign Up a New Account

If you don't have any accounts, sign up through the UI:

1. Go to `http://localhost:3000/auth/signup`
2. Fill in:
   - **Email**: your email
   - **Password**: at least 8 characters
   - **Name**: your name
   - **Tenant Subdomain**: choose a unique subdomain (e.g., "mycompany")
3. Submit the form

## 🎯 Quick Fix for "Invalid credentials or tenant not found"

1. **Check if you have a tenant:**
   ```bash
   # This will show all tenants
   npx prisma studio
   # Then open http://localhost:5555 and check the tenants table
   ```

2. **Reset your password:**
   ```bash
   node scripts/reset-password.js your-email@example.com newpassword
   ```

3. **Verify credentials:**
   ```bash
   node scripts/verify-signin-credentials.js
   ```

## 📋 Required Environment Variables

Make sure your `.env.local` has:

```bash
# Database - Supabase
DATABASE_URL="postgresql://postgres.qacwenfcjjuaneyibiad:[PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require"
DIRECT_URL="postgresql://postgres.qacwenfcjjuaneyibiad:[PASSWORD]@db.qacwenfcjjuaneyibiad.supabase.co:5432/postgres?sslmode=require"

# Supabase Client
NEXT_PUBLIC_SUPABASE_URL="https://qacwenfcjjuaneyibiad.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"
```

## 🔐 Getting Your Database Password

If you forgot your database password:

1. Go to Supabase Dashboard → Settings → Database
2. Click **Reset Database Password**
3. Copy the new password
4. Update both `DATABASE_URL` and `DIRECT_URL` in `.env.local`

## ✅ Next Steps

1. Verify connection: `node scripts/test-db-connection.js`
2. Check database contents: `npx prisma studio`
3. Create test account (if needed): `node scripts/setup-test-account.js`
4. Start dev server: `npm run dev`
5. Sign in at: `http://localhost:3000/auth`



