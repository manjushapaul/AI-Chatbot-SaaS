# Session Diagnostic

## ⚠️ Issue: "Bot not found" Error

The bot **Kerala Tourism** (ID: `cmiimuzx3002p0k20bvxsmqj2`) exists in the database and belongs to the **domain** tenant.

If you're seeing "Bot not found", it means you're logged in with the **wrong tenant account**.

---

## 🔍 Check Which Account You're Logged In As

Look at the top of the dashboard:
- If it says **"Manjusha's Organization"** next to the logo, check the browser console
- The session should show which tenant you're connected to

---

## ✅ Solution: Sign In with Correct Account

### You Have Two Accounts:

| Account | Subdomain | Email | Password | Bots |
|---------|-----------|-------|----------|------|
| **TRIAL** | trial | manjushapaul392@gmail.com | manjusha | 1 bot |
| **DOMAIN** | domain | manjushapaul391@gmail.com | manjusha | **4 bots** ⭐ |

### The Bot Belongs To: **DOMAIN**

**Kerala Tourism Bot:**
- ID: `cmiimuzx3002p0k20bvxsmqj2`
- Tenant: **domain** (cmifkufb0000a0kibqphhui11)
- Owner: manjushapaul391@gmail.com

---

## 🔄 Steps to Fix:

### 1. Sign Out
- Click "Manjusha Paul" in top right
- Click "Sign Out"

### 2. Sign In with DOMAIN Account
Go to: http://localhost:3000/auth/signin

Enter:
- **Tenant Subdomain**: `domain`
- **Email**: `manjushapaul391@gmail.com`
- **Password**: `manjusha`

### 3. Access Your Bots
After signing in, go to:
- **All Bots**: http://localhost:3000/dashboard/bots
- **Kerala Tourism**: http://localhost:3000/dashboard/bots/cmiimuzx3002p0k20bvxsmqj2
- **New Test Bot**: http://localhost:3000/dashboard/bots/7139793892b146268dab2745d3affc94

---

## 🎯 Your 4 Bots (DOMAIN Account)

1. **test** (newest) - ID: `7139793892b146268dab2745d3affc94`
2. **Hayal Hotel** - ID: `cmimnifyt00010kvcqsqo6i7c`
3. **Nex** - ID: `cmiiq1tdx00010k4u7jykexp4`
4. **Kerala Tourism** - ID: `cmiimuzx3002p0k20bvxsmqj2`

All bots will load correctly once you're signed in with the DOMAIN account! 🎉

---

## 🐛 Debug Info

If you still see errors after signing in with the correct account, check browser console for:
```
[Bot Detail] Fetching bot: <bot-id>
[Bot Detail] Response status: 200 or 404
[getTenantContext] Session user: <email> Tenant: <tenant-id>
[GET Bot] Fetching bot: <bot-id> for tenant: <tenant-id>
```

This will show which tenant the API is using vs. which tenant owns the bot.



