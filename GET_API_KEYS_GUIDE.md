# 🔑 How to Get OpenAI and Pinecone API Keys

## Part 1: Get OpenAI API Key

### Step 1: Create/Login to OpenAI Account
1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up or sign in
   - You can use Google, Microsoft, or Apple account
   - Or create account with email

### Step 2: Navigate to API Keys
1. Once logged in, click on your profile icon (top right)
2. Click **"View API keys"** or **"API keys"**
3. Or go directly to: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)

### Step 3: Create New API Key
1. Click **"Create new secret key"** button
2. Give it a name (e.g., "Vercel Production" or "AI ChatBot SaaS")
3. Click **"Create secret key"**
4. **⚠️ IMPORTANT:** Copy the key immediately!
   - It will look like: `sk-proj-...` or `sk-...`
   - You won't be able to see it again after closing the popup
   - Format: `sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Step 4: Add to Vercel
1. Go to Vercel → Your Project → Settings → Environment Variables
2. Click **"Add New"**
3. Fill in:
   - **Key:** `OPENAI_API_KEY`
   - **Value:** Paste your OpenAI API key (starts with `sk-proj-` or `sk-`)
   - **Environment:** Select all (Production, Preview, Development)
4. Click **"Save"**

### 💰 OpenAI Pricing
- Pay-as-you-go model
- Check pricing: [openai.com/pricing](https://openai.com/pricing)
- You get some free credits when you sign up
- Typical cost: ~$0.002 per 1K tokens

---

## Part 2: Get Pinecone API Keys

### Step 1: Create/Login to Pinecone Account
1. Go to [app.pinecone.io](https://app.pinecone.io)
2. Sign up or sign in
   - You can use Google account
   - Or create account with email

### Step 2: Get API Key
1. Once logged in, you'll see your dashboard
2. In the left sidebar, click **"API Keys"**
3. You'll see your default API key (or create a new one)
4. Click **"Create API Key"** if needed
   - Give it a name (e.g., "Vercel Production")
5. **Copy the API key**
   - Format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
   - It's a UUID format

### Step 3: Get Environment
1. Still in Pinecone dashboard
2. Look at the top of the page or in **"Indexes"** section
3. Find your **Environment** name
   - Common values:
     - `gcp-starter` (Free tier - GCP)
     - `us-east-1-aws` (AWS US East)
     - `us-west-2-aws` (AWS US West)
     - `eu-west-1-aws` (AWS Europe)
4. **Note down your environment name**

### Step 4: Create Pinecone Index

**You need to create an index for storing embeddings:**

1. In Pinecone dashboard, click **"Indexes"** (left sidebar)
2. Click **"Create Index"** button
3. Fill in the form:
   - **Index Name:** `ai-chatbot-embeddings` (or any name you prefer)
   - **Dimensions:** `1536` (This is for OpenAI embeddings - very important!)
   - **Metric:** `cosine` (recommended for similarity search)
   - **Environment:** Select your environment
   - **Pod Type:** Choose based on your plan (free tier has limited options)
4. Click **"Create Index"**
5. Wait 1-2 minutes for the index to be created
6. **Note down the index name** (e.g., `ai-chatbot-embeddings`)

### Step 5: Add to Vercel

Add these three environment variables:

#### 1. PINECONE_API_KEY
1. Go to Vercel → Your Project → Settings → Environment Variables
2. Click **"Add New"**
3. Fill in:
   - **Key:** `PINECONE_API_KEY`
   - **Value:** Your Pinecone API key (UUID format)
   - **Environment:** Select all
4. Click **"Save"**

#### 2. PINECONE_ENVIRONMENT
1. Click **"Add New"** again
2. Fill in:
   - **Key:** `PINECONE_ENVIRONMENT`
   - **Value:** Your environment (e.g., `gcp-starter`, `us-east-1-aws`)
   - **Environment:** Select all
3. Click **"Save"**

#### 3. PINECONE_INDEX_NAME
1. Click **"Add New"** again
2. Fill in:
   - **Key:** `PINECONE_INDEX_NAME`
   - **Value:** Your index name (e.g., `ai-chatbot-embeddings`)
   - **Environment:** Select all
3. Click **"Save"**

---

## ✅ Quick Checklist

### OpenAI:
- [ ] Created OpenAI account
- [ ] Generated API key
- [ ] Copied API key (starts with `sk-proj-` or `sk-`)
- [ ] Added `OPENAI_API_KEY` to Vercel

### Pinecone:
- [ ] Created Pinecone account
- [ ] Got API key (UUID format)
- [ ] Noted environment name (e.g., `gcp-starter`)
- [ ] Created index with:
  - Name: `ai-chatbot-embeddings`
  - Dimensions: `1536`
  - Metric: `cosine`
- [ ] Added `PINECONE_API_KEY` to Vercel
- [ ] Added `PINECONE_ENVIRONMENT` to Vercel
- [ ] Added `PINECONE_INDEX_NAME` to Vercel

---

## 🆘 Troubleshooting

### OpenAI API Key Issues:
- **"Invalid API key"**: Make sure you copied the full key (no spaces)
- **"Insufficient credits"**: Add payment method in OpenAI dashboard
- **Key not working**: Regenerate a new key

### Pinecone Issues:
- **"Index not found"**: Wait 2-3 minutes after creating index
- **"Invalid API key"**: Check you copied the full UUID
- **"Wrong dimensions"**: Must be `1536` for OpenAI embeddings
- **Environment mismatch**: Make sure environment matches your index

---

## 💰 Free Tiers Available

### OpenAI:
- Free credits when you sign up
- Then pay-as-you-go

### Pinecone:
- Free tier available (limited)
- Check: [pinecone.io/pricing](https://www.pinecone.io/pricing)

---

## 🔗 Quick Links

- [OpenAI API Keys](https://platform.openai.com/api-keys)
- [OpenAI Pricing](https://openai.com/pricing)
- [Pinecone Dashboard](https://app.pinecone.io)
- [Pinecone Documentation](https://docs.pinecone.io)

---

## 📝 Example Values

After setup, your Vercel environment variables should look like:

```
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PINECONE_API_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
PINECONE_ENVIRONMENT=gcp-starter
PINECONE_INDEX_NAME=ai-chatbot-embeddings
```

---

## 🎯 Next Steps After Adding Keys

1. ✅ All environment variables added to Vercel
2. ✅ Deploy your app (or redeploy)
3. ✅ Test the chatbot functionality
4. ✅ Verify embeddings are being stored in Pinecone

