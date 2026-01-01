# 🔐 Reset Supabase Database Password

## Error: "FATAL: Tenant or user not found"

This means your database password is incorrect. Follow these steps to fix it:

---

## ✅ Step-by-Step Fix

### Step 1: Reset Password in Supabase

1. Go to **Supabase Dashboard**: https://app.supabase.com
2. Select your project: `qacwenfcjjuaneyibiad`
3. Go to **Settings** → **Database**
4. Scroll down to **"Database password"** section
5. Click **"Reset database password"**
6. Set a **new password** (make it simple, no special characters)
   - Example: `MyNewPassword123`
   - **⚠️ IMPORTANT: Save this password!** You'll need it for the connection string.

### Step 2: Get Your Connection String

After resetting the password, you can get the connection string directly from Supabase:

1. In **Settings** → **Database**
2. Scroll to **"Connection pooling"** section
3. Find **"Session mode"** connection string
4. It will look like:
   ```
   postgresql://postgres.qacwenfcjjuaneyibiad:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
   ```
5. Copy this string

### Step 3: Update Local Connection String

1. Open `.env.local` in your project
2. Find the `DATABASE_URL` line
3. Replace it with:
   ```bash
   DATABASE_URL="postgresql://postgres.qacwenfcjjuaneyibiad:[YOUR-NEW-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require"
   ```
4. Replace `[YOUR-NEW-PASSWORD]` with the password you just set
5. **Save the file**

### Step 4: Test Connection Locally

Test if the connection works:

```bash
npx prisma db pull
```

If this works, you'll see:
```
✔ Introspected database
```

If it fails, double-check:
- Password is correct (no typos)
- Connection string format is correct
- Password doesn't have special characters that need URL encoding

### Step 5: Update Vercel (if deployed)

1. Go to **Vercel Dashboard** → Your Project
2. Go to **Settings** → **Environment Variables**
3. Find `DATABASE_URL`
4. Click **Edit**
5. Update with the new password
6. Click **Save**
7. **Redeploy** your application

---

## 🔍 Troubleshooting

### If Password Has Special Characters

If your password has special characters, you may need to URL-encode them:

- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `%` → `%25`
- `&` → `%26`
- `+` → `%2B`
- `=` → `%3D`

**Better solution:** Use a password without special characters to avoid encoding issues.

### Alternative: Use Direct Connection (for testing)

If pooled connection still fails, try direct connection temporarily:

```
postgresql://postgres:[NEW-PASSWORD]@db.qacwenfcjjuaneyibiad.supabase.co:5432/postgres?sslmode=require
```

**Note:** Pooled connection (port 6543) is better for production, but direct (port 5432) can work for testing.

---

## ✅ Quick Checklist

- [ ] Reset password in Supabase Dashboard
- [ ] Saved the new password
- [ ] Updated `DATABASE_URL` in `.env.local`
- [ ] Tested connection with `npx prisma db pull`
- [ ] Updated `DATABASE_URL` in Vercel (if deployed)
- [ ] Redeployed application

---

## 🎯 After Fixing

Once the password is reset and connection string is updated:

1. **Restart your dev server:**
   ```bash
   # Stop the server (Ctrl+C)
   npm run dev
   ```

2. **Try creating a bot again** - it should work now!

---

**The fix is to reset your Supabase database password and update the connection string with the new password.**

