# 🔐 Complete Sign-In Details Reference

This document contains all test accounts, credentials, and sign-in information for the AI Chatbot SaaS platform.

---

## 📋 **Primary Test Accounts**

### **Account 1: Main Test Account** (Most Common)
- **Email:** `admin@test.com`
- **Password:** `password123`
- **Tenant/Subdomain:** `test`
- **Role:** `TENANT_ADMIN`
- **Status:** `ACTIVE`
- **Created By:** `scripts/setup-test-account.js`
- **Sign-In URL:** `http://localhost:3000/auth/signin`
- **Dashboard URL:** `http://localhost:3000/dashboard`

**Setup Script:**
```bash
node scripts/setup-test-account.js
```

**What This Account Includes:**
- ✅ Test Company tenant
- ✅ Test Bot with AI capabilities
- ✅ Test Knowledge Base
- ✅ Test Widget ready for embedding
- ✅ Full admin access

---

### **Account 2: Alternative Test Account**
- **Email:** `test@example.com`
- **Password:** `test123`
- **Tenant/Subdomain:** (varies - check database)
- **Role:** `TENANT_ADMIN`
- **Status:** `ACTIVE`
- **Created By:** `scripts/setup-test-data.js` or `scripts/fix-test-password.js`

**Setup Scripts:**
```bash
# Fix/reset password
node scripts/fix-test-password.js

# Or create new test data
node scripts/setup-test-data.js
```

**Note:** The tenant subdomain for this account may vary. Check your database or run the script to see the exact tenant.

---

### **Account 3: Domain Tenant Account**
- **Email:** `manjushapaul391@gmail.com`
- **Password:** `manjusha`
- **Tenant/Subdomain:** `domain`
- **Role:** (check database)
- **Status:** (check database)
- **Created By:** Manual setup

**Verify Script:**
```bash
node scripts/verify-signin-credentials.js
```

---

## 🚀 **Quick Setup Guide**

### **Step 1: Create Primary Test Account**
```bash
node scripts/setup-test-account.js
```

This creates:
- Tenant: `test` (subdomain)
- User: `admin@test.com` / `password123`
- Bot, Knowledge Base, and Widget

### **Step 2: Start Development Server**
```bash
npm run dev
```

### **Step 3: Sign In**
1. Go to: `http://localhost:3000/auth/signin`
2. Enter:
   - **Email:** `admin@test.com`
   - **Password:** `password123`
   - **Tenant:** `test`
3. Click "Sign In"

---

## 🔧 **Account Management Scripts**

### **Create User**
```bash
node scripts/create-user.js
```
Creates: `admin@test.com` / `password123` / tenant: `test`

### **Fix Test Password**
```bash
node scripts/fix-test-password.js
```
Resets password for: `test@example.com` → `test123`

### **Reset Password (Any User)**
```bash
node scripts/reset-password.js <email> <new-password>
```
Example:
```bash
node scripts/reset-password.js admin@test.com newpassword123
```

### **Unlock Account**
```bash
node scripts/unlock-account.js
```
Shows account details and unlock instructions for `test@example.com`

### **Verify Credentials**
```bash
node scripts/verify-signin-credentials.js
```
Verifies credentials for `manjushapaul391@gmail.com` / `manjusha` / tenant: `domain`

---

## 📝 **Sign-In Form Requirements**

The sign-in form requires **three fields**:

1. **Email Address** - User's email
2. **Password** - User's password (minimum 8 characters)
3. **Tenant Subdomain** - Organization identifier (e.g., `test`, `domain`)

**Important:** All three fields are required. The tenant subdomain must match the tenant associated with the user account.

---

## 🔍 **Finding Your Tenant Subdomain**

If you don't know your tenant subdomain:

### **Method 1: Check Database**
```bash
node scripts/check-database-contents.js
```

### **Method 2: Check Script Output**
When you run setup scripts, they display the tenant subdomain:
```bash
node scripts/setup-test-account.js
# Output shows: Tenant: test
```

### **Method 3: Check User in Database**
```bash
node scripts/verify-signin-credentials.js
# Shows tenant subdomain for the user
```

---

## 🎯 **Common Tenant Subdomains**

Based on the codebase, common tenant subdomains include:

- `test` - Primary test tenant
- `domain` - Domain tenant
- `test-company` - Alternative test tenant

---

## 🔐 **Authentication Methods**

### **1. Email/Password (Credentials)**
- Provider: `credentials`
- Required: Email, Password, Tenant Subdomain
- Status: ✅ Active

### **2. Google OAuth** (Optional)
- Provider: `google`
- Required: Google OAuth credentials in `.env.local`
- Status: Conditional (if credentials are set)

**Setup Google OAuth:**
1. Add to `.env.local`:
   ```bash
   GOOGLE_CLIENT_ID="your-client-id"
   GOOGLE_CLIENT_SECRET="your-client-secret"
   ```
2. Restart dev server

---

## 📍 **Sign-In URLs**

- **Main Sign-In:** `http://localhost:3000/auth/signin`
- **Sign-Up:** `http://localhost:3000/auth/signup`
- **Auth Redirect:** `http://localhost:3000/auth` → redirects to signin
- **Dashboard:** `http://localhost:3000/dashboard` (protected, requires auth)
- **API Providers:** `http://localhost:3000/api/auth/providers`

---

## 🛠️ **Troubleshooting**

### **"Invalid credentials or tenant not found"**

1. **Verify account exists:**
   ```bash
   node scripts/verify-signin-credentials.js
   ```

2. **Check tenant subdomain:**
   - Make sure you're using the correct tenant subdomain
   - Run `node scripts/check-database-contents.js` to see all tenants

3. **Reset password:**
   ```bash
   node scripts/reset-password.js <email> <new-password>
   ```

4. **Recreate test account:**
   ```bash
   node scripts/setup-test-account.js
   ```

### **"Account temporarily locked"**

Account locks after 5 failed attempts for 15 minutes.

**Solutions:**
1. Wait 15 minutes
2. Restart dev server (locks are in-memory)
3. Run unlock script:
   ```bash
   node scripts/unlock-account.js
   ```

### **"Tenant not found"**

1. **Check if tenant exists:**
   ```bash
   node scripts/check-database-contents.js
   ```

2. **Create test tenant:**
   ```bash
   node scripts/setup-test-account.js
   ```

3. **Verify tenant subdomain:**
   - Use lowercase
   - No spaces or special characters
   - Must match exactly in database

---

## 📊 **Account Summary Table**

| Email | Password | Tenant | Role | Script |
|-------|----------|--------|------|--------|
| `admin@test.com` | `password123` | `test` | `TENANT_ADMIN` | `setup-test-account.js` |
| `test@example.com` | `test123` | (varies) | `TENANT_ADMIN` | `setup-test-data.js` |
| `manjushapaul391@gmail.com` | `manjusha` | `domain` | (varies) | Manual |

---

## 🔄 **Password Requirements**

- **Minimum Length:** 8 characters
- **Hashing:** bcrypt with 12 rounds
- **Storage:** Hashed in database (never stored as plain text)

---

## 📚 **Related Documentation**

- **Setup Guide:** `SETUP_GUIDE.md`
- **Authentication:** `AUTHENTICATION_README.md`
- **Troubleshooting:** `AUTH_TROUBLESHOOTING.md`
- **User Guide:** `USER_GUIDE.md`
- **Quick Start:** `QUICK_START.md`

---

## 🎉 **Quick Reference Card**

```
┌─────────────────────────────────────────┐
│   PRIMARY TEST ACCOUNT                  │
├─────────────────────────────────────────┤
│   Email:    admin@test.com              │
│   Password: password123                 │
│   Tenant:   test                        │
│   URL:      localhost:3000/auth/signin  │
└─────────────────────────────────────────┘

Setup: node scripts/setup-test-account.js
```

---

**Last Updated:** December 2024  
**Version:** 1.0.0


