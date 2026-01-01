# 🗄️ Setting Up Database in Supabase

## Overview

You need to run Prisma migrations to create all the database tables in your Supabase database. This can be done in two ways:

1. **Automatically** - During Vercel deployment (recommended)
2. **Manually** - Run locally before deployment

---

## Option 1: Automatic Setup (During Vercel Deployment) ✅ Recommended

Your `package.json` already includes Prisma migrations in the build process:

```json
"build": "prisma generate && prisma migrate deploy && next build"
```

### How It Works:
1. When you deploy to Vercel, the build script automatically:
   - Generates Prisma Client (`prisma generate`)
   - Runs all migrations (`prisma migrate deploy`)
   - Builds your Next.js app

2. **No manual steps needed!** Just deploy and the database will be set up automatically.

### Steps:
1. ✅ Make sure `DATABASE_URL` is set in Vercel environment variables
2. ✅ Deploy your app to Vercel
3. ✅ Check build logs to verify migrations ran successfully
4. ✅ Your database tables will be created automatically

---

## Option 2: Manual Setup (Local Testing)

If you want to set up the database locally first (for testing):

### Step 1: Set Up Local Environment

1. Create a `.env.local` file in your project root:
```bash
DATABASE_URL="postgresql://postgres.kxnjpnjoqugschuyoibk:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
```

Replace `[YOUR-PASSWORD]` with your Supabase database password.

### Step 2: Install Dependencies (if not already done)
```bash
npm install
```

### Step 3: Generate Prisma Client
```bash
npx prisma generate
```

### Step 4: Run Database Migrations
```bash
npx prisma migrate deploy
```

This will:
- Connect to your Supabase database
- Create all tables defined in `prisma/schema.prisma`
- Set up all relationships and indexes

### Step 5: Verify Setup

Check if tables were created:

**Option A: Via Prisma Studio**
```bash
npx prisma studio
```
This opens a visual database browser at `http://localhost:5555`

**Option B: Via Supabase Dashboard**
1. Go to Supabase Dashboard → Your Project
2. Click **"Table Editor"** in left sidebar
3. You should see all your tables listed

**Option C: Via SQL Query**
1. Go to Supabase Dashboard → **SQL Editor**
2. Run:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

---

## What Tables Will Be Created

After running migrations, you'll have these tables:

- `tenants` - Multi-tenant organization data
- `users` - User accounts
- `subscriptions` - Subscription management
- `bots` - AI chatbot configurations
- `knowledge_bases` - Knowledge base storage
- `documents` - Document storage
- `faqs` - FAQ entries
- `conversations` - Chat conversations
- `messages` - Individual chat messages
- `widgets` - Chat widget configurations
- `api_keys` - API key management
- `api_usage` - API usage tracking
- `billing_history` - Payment history
- `notifications` - User notifications
- And more...

---

## Troubleshooting

### Error: "Migration failed"
**Solution:**
- Check your `DATABASE_URL` is correct
- Verify database password is correct
- Ensure database is accessible (not blocked by firewall)

### Error: "Table already exists"
**Solution:**
- This means migrations already ran
- You can reset if needed: `npx prisma migrate reset` (⚠️ This deletes all data!)

### Error: "Connection refused"
**Solution:**
- Check Supabase database is running
- Verify connection string format
- Try using connection pooling (port 6543) instead of direct (port 5432)

### Error: "SSL required"
**Solution:**
- Add `?sslmode=require` to end of connection string:
```
postgresql://...@...supabase.co:5432/postgres?sslmode=require
```

---

## Recommended Approach

### For Production (Vercel):
✅ **Use Option 1 (Automatic)**
- Migrations run automatically during build
- No manual intervention needed
- Safer and more reliable

### For Local Development:
✅ **Use Option 2 (Manual)**
- Test migrations locally first
- Verify database structure
- Debug any issues before deploying

---

## Quick Commands Reference

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations (production)
npx prisma migrate deploy

# Run migrations (development - creates migration files)
npx prisma migrate dev

# View database in browser
npx prisma studio

# Reset database (⚠️ deletes all data!)
npx prisma migrate reset

# Check migration status
npx prisma migrate status
```

---

## Next Steps After Database Setup

1. ✅ Database tables created
2. ✅ Test your app locally (if you ran manual setup)
3. ✅ Deploy to Vercel
4. ✅ Create your first user account
5. ✅ Start using the chatbot!

---

## Verification Checklist

After setup, verify:
- [ ] All tables exist in Supabase
- [ ] Can connect to database
- [ ] Prisma Client generated successfully
- [ ] Migrations completed without errors
- [ ] Can query database (via Prisma Studio or SQL Editor)

---

## 🎉 Success!

Once migrations complete, your Supabase database is ready to use! The chatbot application can now:
- Store user accounts
- Create bots and knowledge bases
- Save conversations
- Track usage
- And much more!


