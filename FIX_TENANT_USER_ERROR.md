# 🔧 Fix "Tenant or user not found" Error

## Error: FATAL: Tenant or user not found

This error means Supabase can't authenticate with the provided credentials. Here's how to fix it:

---

## ✅ Solution 1: Verify Connection String Format

Your connection string looks correct, but let's verify:

**Current:**
```
postgresql://postgres.qacwenfcjjuaneyibiad:v1cUCTr56KK5tOcY@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require
```

**This format is correct!** But the error suggests authentication is failing.

---

## 🔍 Possible Issues & Fixes

### Issue 1: Password Has Special Characters

If your password has special characters, they might need URL encoding.

**Check your password:** `v1cUCTr56KK5tOcY`

If this password has special characters when you set it, you may need to URL-encode them:
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `%` → `%25`
- `&` → `%26`
- `+` → `%2B`
- `=` → `%3D`

### Issue 2: Wrong Password

The password might be different from what you think.

**Solution:**
1. Go to Supabase Dashboard → Settings → Database
2. Click **"Reset database password"**
3. Set a new password (make it simple, no special characters)
4. Update your connection string with the new password

### Issue 3: Connection String Format Issue

Try this alternative format:

**Option A: Without SSL mode first (test):**
```
postgresql://postgres.qacwenfcjjuaneyibiad:v1cUCTr56KK5tOcY@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

**Option B: With connection parameters:**
```
postgresql://postgres.qacwenfcjjuaneyibiad:v1cUCTr56KK5tOcY@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require&connect_timeout=10
```

---

## 🎯 Recommended Fix: Reset Password & Test

### Step 1: Reset Database Password in Supabase

1. Go to Supabase Dashboard → Settings → Database
2. Click **"Reset database password"**
3. Set a new password (use only letters, numbers, no special characters)
   - Example: `MyNewPassword123`
4. **Save the password** - you'll need it!

### Step 2: Build New Connection String

**Format:**
```
postgresql://postgres.qacwenfcjjuaneyibiad:[NEW-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require
```

**Example (if new password is `MyNewPassword123`):**
```
postgresql://postgres.qacwenfcjjuaneyibiad:MyNewPassword123@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require
```

### Step 3: Test Locally First

Before deploying to Vercel, test locally:

1. Create `.env.local` in your project:
```bash
DATABASE_URL="postgresql://postgres.qacwenfcjjuaneyibiad:[NEW-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require"
```

2. Test connection:
```bash
npx prisma db pull
```

If this works locally, it should work on Vercel.

### Step 4: Update Vercel

1. Go to Vercel → Settings → Environment Variables
2. Update `DATABASE_URL` with new password
3. Redeploy

---

## 🔄 Alternative: Use Direct Connection (Temporary Test)

If pooled connection keeps failing, try direct connection to test:

```
postgresql://postgres:[NEW-PASSWORD]@db.qacwenfcjjuaneyibiad.supabase.co:5432/postgres?sslmode=require
```

**Note:** This might work for testing, but pooled (6543) is better for Vercel.

---

## 🧪 Quick Test: Verify Credentials

### Test 1: Check Password in Supabase

1. Go to Supabase Dashboard → Settings → Database
2. Check if you can see/verify the password
3. If not, reset it

### Test 2: Test Connection String Format

Try this exact format (replace with your actual password):

```
postgresql://postgres.qacwenfcjjuaneyibiad:YOUR_PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

### Test 3: Use Supabase's Generated Connection String

1. Go to Supabase Dashboard → Settings → Database
2. Scroll to **"Connection string"** or **"Connection pooling"**
3. Copy the **exact** connection string they provide
4. Replace `[YOUR-PASSWORD]` with your actual password
5. Use that exact format

---

## ✅ Most Likely Solution

**Reset your database password** and use a simple password (no special characters):

1. Supabase → Settings → Database → Reset database password
2. Set new password: `MyPassword123` (example)
3. Update connection string:
```
postgresql://postgres.qacwenfcjjuaneyibiad:MyPassword123@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require
```
4. Update in Vercel
5. Redeploy

---

## 📋 Checklist

- [ ] Verified password is correct
- [ ] Reset database password (if needed)
- [ ] Connection string uses correct format
- [ ] Tested connection locally (if possible)
- [ ] Updated `DATABASE_URL` in Vercel
- [ ] Redeployed

---

## 🆘 Still Not Working?

If you've tried everything:

1. **Double-check project reference ID:**
   - URL: `https://app.supabase.com/project/qacwenfcjjuaneyibiad`
   - Make sure it matches in connection string

2. **Try getting connection string directly from Supabase:**
   - Settings → Database → Connection pooling → Session mode
   - Copy the exact format they provide

3. **Contact Supabase support** if credentials are definitely correct

---

**🎯 The most common fix is resetting the database password and using a simple password without special characters.**



