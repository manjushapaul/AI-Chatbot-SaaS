# 🔴 URGENT: Fix Database Connection

## Current Error: "Database connection failed"

Your database password is **incorrect**. You need to reset it in Supabase and update your `.env.local` file.

---

## ✅ Step-by-Step Fix (5 minutes)

### Step 1: Reset Password in Supabase

1. **Go to Supabase Dashboard:**
   - Open: https://app.supabase.com/project/qacwenfcjjuaneyibiad
   - Or go to: https://app.supabase.com → Select your project

2. **Navigate to Database Settings:**
   - Click **"Settings"** (gear icon in left sidebar)
   - Click **"Database"** in the settings menu

3. **Reset the Password:**
   - Scroll down to **"Database password"** section
   - Click **"Reset database password"** button
   - **Set a NEW password** (use only letters and numbers, no special characters)
     - ✅ Good: `MyPassword123`
     - ✅ Good: `SupabasePass456`
     - ❌ Bad: `My@Pass#123` (has special characters)
   - **⚠️ IMPORTANT: Copy the password immediately!** You won't be able to see it again.

### Step 2: Update .env.local

1. **Open `.env.local`** in your project root

2. **Find this line:**
   ```bash
   DATABASE_URL="postgresql://postgres.qacwenfcjjuaneyibiad:iuTU7naRkgmJyBAm@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require"
   ```

3. **Replace `iuTU7naRkgmJyBAm` with your NEW password:**
   ```bash
   DATABASE_URL="postgresql://postgres.qacwenfcjjuaneyibiad:[YOUR-NEW-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require"
   ```

4. **Save the file**

### Step 3: Test the Connection

Run this command to test:

```bash
node -e "require('dotenv').config({ path: '.env.local' }); const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.\$connect().then(() => { console.log('✅ Connection successful!'); process.exit(0); }).catch((err) => { console.error('❌ Connection failed:', err.message); process.exit(1); });"
```

**If you see "✅ Connection successful!"** - you're done! Go to Step 4.

**If you see "❌ Connection failed"** - the password is still wrong. Go back to Step 1.

### Step 4: Restart Dev Server

1. **Stop the dev server** (press `Ctrl+C` in the terminal where it's running)

2. **Clear Next.js cache:**
   ```bash
   rm -rf .next
   ```

3. **Restart the dev server:**
   ```bash
   npm run dev
   ```

### Step 5: Try Again

1. **Go to signup page:** http://localhost:3000/auth/signup
2. **Fill in the form**
3. **Click "Create Account"**

It should work now! ✅

---

## 🔍 Troubleshooting

### Password Has Special Characters?

If your password has special characters, you MUST URL-encode them in the connection string:

- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `%` → `%25`
- `&` → `%26`
- `+` → `%2B`
- `=` → `%3D`

**Better solution:** Use a password WITHOUT special characters to avoid encoding issues.

### Still Not Working?

1. **Double-check the password** - Make sure you copied it correctly from Supabase
2. **Verify the connection string format** - It should look exactly like:
   ```
   postgresql://postgres.qacwenfcjjuaneyibiad:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require
   ```
3. **Check for typos** - Make sure there are no extra spaces or characters
4. **Try getting connection string from Supabase:**
   - Settings → Database → Connection pooling → Session mode
   - Copy the exact string they provide
   - Replace `[YOUR-PASSWORD]` with your actual password

---

## ✅ Quick Checklist

- [ ] Reset password in Supabase Dashboard
- [ ] Copied the new password
- [ ] Updated `DATABASE_URL` in `.env.local`
- [ ] Tested connection (Step 3) - got ✅ success
- [ ] Cleared `.next` cache
- [ ] Restarted dev server
- [ ] Tried signing up again

---

## 🎯 What's Happening?

The error "Database connection failed" means:
- Your application is trying to connect to Supabase
- The password in `.env.local` is incorrect
- Supabase is rejecting the connection with "FATAL: Tenant or user not found"

**Once you reset the password and update `.env.local`, everything will work!**

---

**🚀 After fixing, you'll be able to:**
- ✅ Create new accounts (signup)
- ✅ Create bots
- ✅ Upload documents
- ✅ Use all features that require database access




