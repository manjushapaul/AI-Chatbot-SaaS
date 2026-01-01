# 🔍 Test Database Connection

## Current Issue: "FATAL: Tenant or user not found"

The password `iuTU7naRkgmJyBAm` is still incorrect. You need to:

---

## ✅ Step 1: Reset Password in Supabase (Again)

1. Go to **Supabase Dashboard**: https://app.supabase.com/project/qacwenfcjjuaneyibiad
2. Go to **Settings** → **Database**
3. Scroll to **"Database password"** section
4. Click **"Reset database password"**
5. **Set a SIMPLE password** (only letters and numbers, no special characters):
   - ✅ Good: `MyPassword123`
   - ❌ Bad: `My@Pass#123` (has special characters)
6. **Copy the password** - you'll need it!

---

## ✅ Step 2: Get Connection String from Supabase

**Option A: Use Supabase's Generated String**

1. In **Settings** → **Database**
2. Scroll to **"Connection pooling"** section
3. Find **"Session mode"** connection string
4. It should look like:
   ```
   postgresql://postgres.qacwenfcjjuaneyibiad:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
   ```
5. **Copy this EXACT string**

**Option B: Build It Manually**

Format:
```
postgresql://postgres.qacwenfcjjuaneyibiad:[YOUR-NEW-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require
```

Replace `[YOUR-NEW-PASSWORD]` with the password you just set.

---

## ✅ Step 3: Update .env.local

1. Open `.env.local` in your project
2. Find the `DATABASE_URL` line
3. Replace it with the connection string from Step 2
4. **Save the file**

---

## ✅ Step 4: Test Connection

Run this command to test:

```bash
node -e "require('dotenv').config({ path: '.env.local' }); const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.\$connect().then(() => { console.log('✅ Connection successful!'); process.exit(0); }).catch((err) => { console.error('❌ Connection failed:', err.message); process.exit(1); });"
```

**If you see "✅ Connection successful!"** - the password is correct!

**If you see "❌ Connection failed"** - the password is still wrong, go back to Step 1.

---

## ✅ Step 5: Restart Dev Server

After the connection test succeeds:

1. **Stop the dev server** (Ctrl+C in the terminal)
2. **Clear Next.js cache:**
   ```bash
   rm -rf .next
   ```
3. **Restart dev server:**
   ```bash
   npm run dev
   ```

---

## 🔍 Troubleshooting

### Password Has Special Characters?

If your password has special characters, you MUST URL-encode them:

- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `%` → `%25`
- `&` → `%26`
- `+` → `%2B`
- `=` → `%3D`

**Better:** Use a password WITHOUT special characters to avoid encoding issues.

### Still Not Working?

1. **Double-check the password** in Supabase Dashboard
2. **Verify the project reference ID** is `qacwenfcjjuaneyibiad`
3. **Check the region** is `ap-southeast-1`
4. **Try the direct connection** (port 5432) to test:
   ```
   postgresql://postgres:[PASSWORD]@db.qacwenfcjjuaneyibiad.supabase.co:5432/postgres?sslmode=require
   ```

---

## 🎯 Quick Checklist

- [ ] Reset password in Supabase Dashboard
- [ ] Copied the new password
- [ ] Got connection string from Supabase (or built it manually)
- [ ] Updated `DATABASE_URL` in `.env.local`
- [ ] Tested connection (Step 4) - got ✅ success
- [ ] Cleared `.next` cache
- [ ] Restarted dev server
- [ ] Tried creating bot again

---

**The password `iuTU7naRkgmJyBAm` is incorrect. You need to reset it in Supabase and update `.env.local` with the new password.**

