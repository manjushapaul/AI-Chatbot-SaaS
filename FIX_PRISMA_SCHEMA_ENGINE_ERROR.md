# 🔧 Fix Prisma Schema Engine Error

## Error: Schema engine error

This error occurs when Prisma tries to use a connection pooler for schema operations. Prisma's schema engine needs a **direct connection** (not pooled) for migrations and introspection.

---

## ✅ Solution: Use Direct Connection for Migrations

### The Problem

Your connection string has `pgbouncer=true`:
```
postgresql://postgres.qacwenfcjjuaneyibiad:password@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require
```

**Prisma schema engine doesn't work with connection pooling!**

### The Fix

For **migrations and schema operations**, use a **direct connection** (port 5432):

```
postgresql://postgres:password@db.qacwenfcjjuaneyibiad.supabase.co:5432/postgres?sslmode=require
```

For **runtime/application**, use the **pooled connection** (port 6543):

```
postgresql://postgres.qacwenfcjjuaneyibiad:password@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require
```

---

## 🎯 Recommended Approach

### Option 1: Use Direct Connection for Migrations (Recommended)

**For local development and migrations:**

1. Update `.env.local`:
```bash
# For migrations - direct connection
DATABASE_URL="postgresql://postgres:password@db.qacwenfcjjuaneyibiad.supabase.co:5432/postgres?sslmode=require"
```

2. Run migrations:
```bash
npx prisma migrate deploy
npx prisma generate
```

3. For Vercel deployment, use pooled connection in environment variables

### Option 2: Remove pgbouncer Parameter

If you want to use pooled connection, remove `pgbouncer=true`:

**Before:**
```
postgresql://...@pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require
```

**After:**
```
postgresql://...@pooler.supabase.com:6543/postgres?sslmode=require
```

---

## 📝 Connection String Formats

### Direct Connection (Port 5432) - For Migrations
```
postgresql://postgres:password@db.qacwenfcjjuaneyibiad.supabase.co:5432/postgres?sslmode=require
```

**Use for:**
- ✅ Prisma migrations (`prisma migrate deploy`)
- ✅ Prisma introspection (`prisma db pull`)
- ✅ Prisma Studio (`prisma studio`)
- ✅ Local development

### Pooled Connection (Port 6543) - For Runtime
```
postgresql://postgres.qacwenfcjjuaneyibiad:password@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require
```

**Use for:**
- ✅ Vercel deployments
- ✅ Production applications
- ✅ Serverless functions

---

## 🔧 Quick Fix Steps

### Step 1: Update .env.local for Migrations

```bash
# Direct connection for migrations
DATABASE_URL="postgresql://postgres:TjFsJ1mQb2IxXhxe@db.qacwenfcjjuaneyibiad.supabase.co:5432/postgres?sslmode=require"
```

### Step 2: Test Connection

```bash
npx prisma db pull
```

### Step 3: Run Migrations

```bash
npx prisma migrate deploy
npx prisma generate
```

### Step 4: For Vercel

Keep the pooled connection in Vercel environment variables:
```
DATABASE_URL="postgresql://postgres.qacwenfcjjuaneyibiad:TjFsJ1mQb2IxXhxe@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require"
```

---

## ⚠️ Important Notes

1. **Migrations need direct connection** - Pooled connections don't work for schema operations
2. **Runtime can use pooled** - Better for serverless/Vercel
3. **Two connection strings** - One for migrations, one for runtime
4. **Vercel build** - Your `package.json` build script will use the pooled connection from Vercel env vars

---

## 🆘 If Still Failing

### Check Password
- Verify password is correct
- Reset in Supabase if needed

### Check Connection String Format
- Direct: `postgres:password@db.xxx.supabase.co:5432`
- Pooled: `postgres.xxx:password@aws-0-region.pooler.supabase.com:6543`

### Test Connection
```bash
# Test direct connection
DATABASE_URL="postgresql://postgres:password@db.qacwenfcjjuaneyibiad.supabase.co:5432/postgres?sslmode=require" npx prisma db pull
```

---

## ✅ Summary

**For migrations:** Use direct connection (port 5432)  
**For runtime:** Use pooled connection (port 6543)  
**Remove:** `pgbouncer=true` parameter

This should fix the schema engine error!


