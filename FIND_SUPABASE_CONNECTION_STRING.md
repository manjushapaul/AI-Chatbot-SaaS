# 🔍 How to Find Supabase Connection String

## You're Currently On: API Keys Page ❌
The connection string is **NOT** on the API Keys page. You need to go to a different section.

---

## ✅ Correct Location: Settings → Database

### Step-by-Step:

1. **In the left sidebar**, look for **"CONFIGURATION"** section
2. Click on **"Database"** (it has an external link icon 🔗)
   - This is different from "API Keys" - it's in the CONFIGURATION section, not PROJECT SETTINGS
3. On the Database page, scroll down past all the settings
4. Look for a section called:
   - **"Connection string"**
   - **"Connection info"**
   - **"Database URL"**
   - Or **"Connection pooling"**

---

## 🔄 Alternative: Construct It Manually

If you still can't find it, you can build it yourself:

### What You Need:
1. **Project Reference ID** - Found in your Supabase URL:
   - Your URL looks like: `https://app.supabase.com/project/[PROJECT-REF]`
   - The `[PROJECT-REF]` is a long string of letters/numbers

2. **Database Password** - The password you set when creating the project

### Build the Connection String:

**Direct Connection (Port 5432):**
```
postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

**Pooled Connection (Port 6543) - Recommended for Vercel:**
```
postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

### How to Get Project Reference:
1. Look at your browser URL when in Supabase dashboard
2. It will be: `https://app.supabase.com/project/[PROJECT-REF]`
3. Copy the `[PROJECT-REF]` part

### How to Get Region:
- Check Settings → General → Region
- Or it's usually in your connection pooling URL if you can see it

---

## 🎯 Quick Steps Right Now:

1. **Look at the left sidebar** - Find "CONFIGURATION" section
2. **Click "Database"** (not API Keys)
3. **Scroll to the bottom** of that page
4. **Look for "Connection string"** section

OR

1. **Check your browser URL** - Get your project reference ID
2. **Remember your database password** (from when you created the project)
3. **Build the connection string** using the format above

---

## 📝 Example:

If your:
- Project Reference: `abcdefghijklmnop`
- Password: `MyPassword123!`
- Region: `us-east-1`

Your connection string would be:
```
postgresql://postgres.MyPassword123!@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

Wait, that's wrong. Let me fix the format:

**Correct format:**
```
postgresql://postgres.abcdefghijklmnop:MyPassword123!@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

---

## 🆘 Still Can't Find It?

Try these:
1. **Settings → General** - Check for project reference ID
2. **Settings → Database** - Scroll all the way down
3. **Project Overview** - Sometimes shown on the main dashboard
4. **Contact Supabase Support** - They can help you locate it

---

## ✅ Once You Have It:

Add it to Vercel as:
- **Key:** `DATABASE_URL`
- **Value:** Your full connection string
- **Environment:** All (Production, Preview, Development)





