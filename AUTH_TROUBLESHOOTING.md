# Authentication Troubleshooting Guide

## ✅ Verified Working
- Database connection: ✅ WORKING
- Credentials: ✅ VALID
- Test authentication flow: ✅ SUCCESS

**Test Account:**
- Email: `admin@test.com`
- Password: `password123`
- Tenant: `test`

## 🔍 Issue Diagnosis

The authentication test script works perfectly, but Next.js app shows "Invalid credentials or tenant not found". This suggests a **runtime environment issue**.

## 🛠️ Solutions to Try

### Solution 1: Restart Dev Server
Environment variables might not be loaded properly.

```bash
# Stop the dev server (Ctrl+C)
# Then restart:
npm run dev
```

### Solution 2: Clear Next.js Cache
Sometimes the cache causes issues with Prisma Client.

```bash
rm -rf .next
npm run dev
```

### Solution 3: Check Server Console
When you try to sign in, check the **terminal where `npm run dev` is running**. You should now see detailed error logs showing exactly what's failing.

Look for:
- `Auth error:` - Shows the actual error
- `⚠️ Database connection error` - Indicates Prisma connection issue
- `DATABASE_URL exists:` / `DIRECT_URL exists:` - Shows if env vars are loaded

### Solution 4: Verify Environment Variables
Make sure `.env.local` is in the project root and has:

```bash
DATABASE_URL="postgresql://postgres.qacwenfcjjuaneyibiad:HS3JcBDUUO6vvqda@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require"
DIRECT_URL="postgresql://postgres.qacwenfcjjuaneyibiad:HS3JcBDUUO6vvqda@db.qacwenfcjjuaneyibiad.supabase.co:5432/postgres?sslmode=require"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"
```

### Solution 5: Regenerate Prisma Client
```bash
npx prisma generate
```

### Solution 6: Test Database Connection
```bash
node scripts/test-db-connection.js
```

## 🔍 Debugging Steps

1. **Check Server Logs**
   - Open the terminal running `npm run dev`
   - Try to sign in
   - Look for error messages starting with `Auth error:`

2. **Verify Database**
   ```bash
   node scripts/check-database-contents.js
   ```

3. **Test Authentication Flow**
   ```bash
   node scripts/test-auth-direct.js
   ```

4. **Check Environment**
   ```bash
   node -e "require('dotenv').config({ path: '.env.local' }); console.log('DATABASE_URL:', !!process.env.DATABASE_URL);"
   ```

## 📝 Common Issues

### Issue: "Authentication failed against database server"
**Cause:** DIRECT_URL might have wrong credentials or connection issue

**Fix:** Verify DIRECT_URL in Supabase dashboard:
1. Go to Supabase Dashboard → Settings → Database
2. Copy the connection string for "Direct connection" (port 5432)
3. Update DIRECT_URL in `.env.local`
4. Restart dev server

### Issue: Environment variables not loading
**Cause:** Next.js might not be reading `.env.local`

**Fix:**
1. Ensure `.env.local` is in project root (same level as `package.json`)
2. Restart dev server
3. Clear `.next` cache

### Issue: Prisma Client out of date
**Cause:** Schema changed but client not regenerated

**Fix:**
```bash
npx prisma generate
npm run dev
```

## 🎯 Next Steps

After trying the solutions above:
1. **Try signing in again** at `http://localhost:3000/auth`
2. **Check the server console** for detailed error messages
3. **Share the error logs** if the issue persists

The enhanced error logging will help identify the exact problem!

