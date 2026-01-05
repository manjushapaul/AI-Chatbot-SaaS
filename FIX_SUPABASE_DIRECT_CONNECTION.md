# 🔧 Fix Supabase Direct Connection Issue

## Error: Can't reach database server at port 5432

Supabase often blocks direct connections (port 5432) for security. You need to enable it or use an alternative approach.

---

## ✅ Solution 1: Enable Direct Connections in Supabase

### Step 1: Check Network Restrictions

1. Go to Supabase Dashboard → Settings → Database
2. Scroll to **"Network Restrictions"** section
3. Check if direct connections are allowed
4. If restricted, you may need to:
   - Add your IP address to allowed list
   - Or enable direct connections (if available in your plan)

### Step 2: Check Connection Pooling Settings

1. In Supabase Dashboard → Settings → Database
2. Look for **"Connection pooling"** settings
3. Some plans require you to use pooled connections only

---

## ✅ Solution 2: Use Pooled Connection Without pgbouncer Parameter

Try removing `pgbouncer=true` from the connection string:

**Before:**
```
postgresql://postgres.qacwenfcjjuaneyibiad:password@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require
```

**After:**
```
postgresql://postgres.qacwenfcjjuaneyibiad:password@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require
```

Then try:
```bash
npx prisma db pull
```

---

## ✅ Solution 3: Skip Migrations During Build (For Vercel)

If Prisma schema engine can't connect, you can:

1. **Run migrations manually first** (using Supabase SQL Editor or local connection)
2. **Modify build script** to skip migrations:

Update `package.json`:
```json
{
  "scripts": {
    "build": "prisma generate && next build"
  }
}
```

Remove `prisma migrate deploy` from build script.

3. **Run migrations separately** after deployment via:
   - Supabase SQL Editor
   - Or a one-time migration script

---

## ✅ Solution 4: Use Supabase SQL Editor for Migrations

Instead of Prisma migrations, you can:

1. Go to Supabase Dashboard → SQL Editor
2. Copy your migration SQL files
3. Run them directly in SQL Editor
4. Then use Prisma just for client generation

---

## 🎯 Recommended Approach

### For Local Development:

1. **Try pooled connection without pgbouncer:**
```bash
DATABASE_URL="postgresql://postgres.qacwenfcjjuaneyibiad:TjFsJ1mQb2IxXhxe@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require" npx prisma db pull
```

2. **If that fails, use Supabase SQL Editor** to run migrations manually

### For Vercel Deployment:

1. **Use pooled connection** in environment variables (already set)
2. **Modify build script** to skip migrations if they fail:
```json
"build": "prisma generate && next build"
```
3. **Run migrations manually** via Supabase SQL Editor first

---

## 🔍 Check Your Supabase Plan

Free tier Supabase:
- ✅ Allows pooled connections (port 6543)
- ❌ May block direct connections (port 5432)
- ✅ Can use SQL Editor for migrations

Paid plans:
- ✅ Usually allow both direct and pooled
- ✅ More connection options

---

## 📝 Quick Test

Try this connection string format (pooled, no pgbouncer):

```bash
DATABASE_URL="postgresql://postgres.qacwenfcjjuaneyibiad:TjFsJ1mQb2IxXhxe@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require" npx prisma generate
```

If `prisma generate` works, then the connection is fine for client generation. Migrations might need to be done differently.

---

## 🆘 If Nothing Works

1. **Check Supabase Dashboard** → Settings → Database → Network Restrictions
2. **Contact Supabase Support** about direct connection access
3. **Use SQL Editor** for all migrations
4. **Use Prisma only for client generation**, not migrations

---

**The key is: Prisma Client generation works with pooled connections, but migrations might need direct connections or manual SQL execution.**




