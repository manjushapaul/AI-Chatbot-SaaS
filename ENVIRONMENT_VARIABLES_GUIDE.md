# 🔑 Environment Variables Guide - Where to Get Each One

## 1. DATABASE_URL (PostgreSQL Connection String)

### Option A: Vercel Postgres (Easiest - Recommended)
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your project → **Storage** tab
3. Click **Create Database** → Select **Postgres**
4. Choose a name (e.g., `ai-chatbot-db`)
5. Vercel will automatically:
   - Create the database
   - Add `DATABASE_URL` to your environment variables
   - Format: `postgresql://user:password@host:5432/database?sslmode=require`

### Option B: Neon (Free Tier Available)
1. Go to [neon.tech](https://neon.tech)
2. Sign up / Sign in
3. Click **Create Project**
4. Choose a name and region
5. After creation, copy the **Connection String**
   - Format: `postgresql://user:password@host/database?sslmode=require`
6. Add to Vercel as `DATABASE_URL`

### Option C: Supabase (Free Tier Available)
1. Go to [supabase.com](https://supabase.com)
2. Sign up / Sign in
3. Create a new project
4. Go to **Settings** → **Database**
5. Copy the **Connection String** (URI format)
6. Add to Vercel as `DATABASE_URL`

### Option D: Railway
1. Go to [railway.app](https://railway.app)
2. Sign up / Sign in
3. Click **New Project** → **Provision PostgreSQL**
4. Click on the PostgreSQL service
5. Go to **Variables** tab
6. Copy the `DATABASE_URL`
7. Add to Vercel as `DATABASE_URL`

---

## 2. NEXTAUTH_URL

**This is your Vercel app URL - you'll get it AFTER first deployment!**

1. Deploy your app to Vercel (even without all env vars)
2. Vercel will give you a URL like: `https://ai-chatbot-saas-xyz.vercel.app`
3. Go to Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
4. Add: `NEXTAUTH_URL` = `https://your-actual-app-name.vercel.app`
5. Redeploy after adding it

**For local development:** Use `http://localhost:3000`

---

## 3. NEXTAUTH_SECRET

**Generate this yourself using command line:**

### On Mac/Linux:
```bash
openssl rand -base64 32
```

### On Windows (PowerShell):
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

### Or use online generator:
- Go to [generate-secret.vercel.app](https://generate-secret.vercel.app/32)
- Copy the generated secret
- Add to Vercel as `NEXTAUTH_SECRET`

**Example output:** `aBc123XyZ456DeF789GhI012JkL345MnO678PqR901StU234VwX=`

---

## 4. OPENAI_API_KEY

1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up / Sign in (or create account)
3. Click on your profile (top right) → **View API keys**
4. Click **Create new secret key**
5. Give it a name (e.g., "Vercel Production")
6. **IMPORTANT:** Copy the key immediately (you won't see it again!)
7. Add to Vercel as `OPENAI_API_KEY`
   - Format: `sk-proj-...` or `sk-...`

**Pricing:** Pay-as-you-go. Check [pricing page](https://openai.com/pricing)

---

## 5. PINECONE_API_KEY

1. Go to [app.pinecone.io](https://app.pinecone.io)
2. Sign up / Sign in (or create account)
3. Go to **API Keys** section (left sidebar)
4. Click **Create API Key**
5. Give it a name (e.g., "Vercel Production")
6. Copy the API key
7. Add to Vercel as `PINECONE_API_KEY`
   - Format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

**Free Tier:** Available with limited credits

---

## 6. PINECONE_ENVIRONMENT

**This is your Pinecone environment/region**

1. In Pinecone dashboard, go to **Indexes** section
2. When you create an index, you'll see the environment
3. Common values:
   - `us-east-1-aws` (AWS US East)
   - `us-west-2-aws` (AWS US West)
   - `gcp-starter` (GCP Starter - Free tier)
   - `gcp-us-west1` (GCP US West)
4. Or check your Pinecone dashboard → **Indexes** → Your index → **Environment**
5. Add to Vercel as `PINECONE_ENVIRONMENT`

**Note:** If using free tier, it's usually `gcp-starter`

---

## 7. PINECONE_INDEX_NAME

**You need to CREATE this index in Pinecone:**

1. Go to [app.pinecone.io](https://app.pinecone.io)
2. Go to **Indexes** section
3. Click **Create Index**
4. Fill in:
   - **Index Name:** `ai-chatbot-embeddings` (or any name you prefer)
   - **Dimensions:** `1536` (for OpenAI embeddings)
   - **Metric:** `cosine`
   - **Environment:** Choose your environment
5. Click **Create Index**
6. Wait for index to be created (1-2 minutes)
7. Add the index name to Vercel as `PINECONE_INDEX_NAME`
   - Example: `ai-chatbot-embeddings`

---

## 📋 Quick Setup Checklist

### Before Deployment:
- [ ] Create PostgreSQL database → Get `DATABASE_URL`
- [ ] Generate `NEXTAUTH_SECRET` using `openssl rand -base64 32`
- [ ] Get `OPENAI_API_KEY` from OpenAI dashboard
- [ ] Get `PINECONE_API_KEY` from Pinecone dashboard
- [ ] Note your `PINECONE_ENVIRONMENT` from Pinecone
- [ ] Create Pinecone index → Get `PINECONE_INDEX_NAME`

### After First Deployment:
- [ ] Get your Vercel app URL → Add as `NEXTAUTH_URL`
- [ ] Redeploy with `NEXTAUTH_URL` set

---

## 🆘 Troubleshooting

### "Invalid API Key" Errors
- Double-check you copied the full key (no spaces)
- Regenerate if needed

### Database Connection Issues
- Ensure connection string includes `?sslmode=require` at the end
- Check database allows external connections

### Pinecone Index Not Found
- Wait 2-3 minutes after creating index
- Verify index name matches exactly (case-sensitive)

---

## 💰 Cost Estimates (Free Tiers Available)

- **PostgreSQL:** Free tiers on Neon, Supabase, Railway
- **OpenAI:** Pay-as-you-go (~$0.002 per 1K tokens)
- **Pinecone:** Free tier available (limited)
- **Vercel:** Free tier available (hobby plan)

---

## 🔗 Quick Links

- [Vercel Dashboard](https://vercel.com/dashboard)
- [OpenAI API Keys](https://platform.openai.com/api-keys)
- [Pinecone Dashboard](https://app.pinecone.io)
- [Neon Database](https://neon.tech)
- [Supabase Database](https://supabase.com)
- [Railway Database](https://railway.app)





