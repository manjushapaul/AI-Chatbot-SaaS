# 🔧 Fix Database Connection Error

## Error: P1001: Can't reach database server

This error means Vercel can't connect to your Supabase database. Here's how to fix it:

---

## ✅ Solution: Use Connection Pooling (Port 6543)

The direct connection (port 5432) often fails on Vercel. Use the **pooled connection** instead.

### Step 1: Get Your Correct Connection String

Your connection string should use **port 6543** (pooled) instead of **5432** (direct).

**Current (Wrong):**
```
postgresql://postgres:[PASSWORD]@db.kxnjpnjoqugschuyoibk.supabase.co:5432/postgres
```

**Correct (Pooled):**
```
postgresql://postgres.kxnjpnjoqugschuyoibk:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

### Step 2: Find Your Region

1. Go to Supabase Dashboard → Settings → General
2. Check your **Region** (e.g., `us-east-1`, `eu-west-1`, `ap-southeast-1`)
3. Note it down

### Step 3: Build the Correct Connection String

**Format:**
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require
```

**Your Project Reference:** `kxnjpnjoqugschuyoibk`

**Example (if region is `us-east-1`):**
```
postgresql://postgres.kxnjpnjoqugschuyoibk:YourPassword123!@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require
```

### Step 4: Update in Vercel

1. Go to Vercel → Your Project → Settings → Environment Variables
2. Find `DATABASE_URL`
3. Click **Edit**
4. Replace with the pooled connection string (port 6543)
5. Make sure to add `?sslmode=require` at the end
6. Click **Save**

### Step 5: Redeploy

1. Go to Deployments
2. Click **"Redeploy"** on the latest deployment
3. Or push a new commit to trigger deployment

---

## 🔍 Alternative: Get Connection String from Supabase

If you want to get it directly from Supabase:

1. Go to Supabase Dashboard → Settings → Database
2. Scroll to **"Connection pooling"** section
3. Find **"Session mode"** connection string
4. Copy that connection string
5. Replace `[YOUR-PASSWORD]` with your actual password
6. Add to Vercel as `DATABASE_URL`

---

## 📝 Important Notes

### 1. Password Encoding
If your password has special characters, you may need to URL-encode them:
- `@` becomes `%40`
- `#` becomes `%23`
- `$` becomes `%24`
- `%` becomes `%25`
- `&` becomes `%26`
- `+` becomes `%2B`
- `=` becomes `%3D`

### 2. SSL Mode
Always add `?sslmode=require` at the end for Supabase:
```
...postgres?sslmode=require
```

### 3. Pooled vs Direct
- **Pooled (6543)** - ✅ Recommended for Vercel/serverless
- **Direct (5432)** - ❌ Often fails on serverless platforms

---

## 🧪 Test Connection Locally

Before deploying, test the connection:

1. Create `.env.local`:
```bash
DATABASE_URL="postgresql://postgres.kxnjpnjoqugschuyoibk:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require"
```

2. Test connection:
```bash
npx prisma db pull
```

If this works locally, it should work on Vercel.

---

## ✅ Checklist

- [ ] Using pooled connection (port 6543)
- [ ] Connection string format is correct
- [ ] Password is correct (and URL-encoded if needed)
- [ ] Region is correct in connection string
- [ ] Added `?sslmode=require` at the end
- [ ] Updated `DATABASE_URL` in Vercel
- [ ] Redeployed the app

---

## 🆘 Still Not Working?

### Check These:
1. **Supabase database is running** - Check dashboard
2. **Network restrictions** - Settings → Database → Network Restrictions
3. **Password is correct** - Try resetting in Supabase
4. **Region matches** - Verify region in connection string

### Try Direct Connection (if pooling fails):
```
postgresql://postgres:[PASSWORD]@db.kxnjpnjoqugschuyoibk.supabase.co:5432/postgres?sslmode=require
```

But pooled is usually better for Vercel!

---

**🎯 The fix is to use the pooled connection string (port 6543) instead of direct (port 5432).**





