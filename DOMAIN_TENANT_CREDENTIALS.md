# Domain Tenant Login Credentials

## 🔐 Login Details

**Most Active Workspace** - 3 bots, 3 knowledge bases, 63 conversations

### Credentials
- **Email**: `manjushapaul391@gmail.com`
- **Password**: `manjusha`
- **Tenant Subdomain**: `domain`
- **Role**: BOT_OPERATOR

### Login URLs
- **Main**: http://localhost:3000/auth/signin
- **With Subdomain**: http://domain.localhost:3000/auth/signin

### Organization Details
- **Name**: Manjusha's Organization
- **Subdomain**: domain
- **Plan**: FREE
- **Status**: ACTIVE
- **Tenant ID**: cmifkufb0000a0kibqphhui11

### Resources
- **Bots**: 3
- **Knowledge Bases**: 3
- **Conversations**: 63

---

## ✅ Authentication Fixed

### Issues Found and Fixed:
1. **Prisma Model Names**: Changed from singular (`prisma.user`, `prisma.tenant`) to plural (`prisma.users`, `prisma.tenants`)
2. **Include Relations**: Changed from `include: { tenant: true }` to `include: { tenants: true }`
3. **Password Reset**: Password has been reset to `manjusha` using bcrypt hash

### Files Updated:
- `src/lib/auth.ts` - Fixed all Prisma model references
- `src/lib/tenant.ts` - Fixed tenant lookup
- `scripts/reset-password.js` - Created password reset utility

---

## 🧪 Testing

Run this command to verify credentials:
```bash
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

(async () => {
  const tenant = await prisma.tenants.findUnique({ where: { subdomain: 'domain' } });
  const user = await prisma.users.findFirst({ 
    where: { email: 'manjushapaul391@gmail.com', tenantId: tenant.id } 
  });
  const valid = await bcrypt.compare('manjusha', user.password);
  console.log('Credentials valid:', valid);
  await prisma.\$disconnect();
})();
"
```

---

## 📝 How to Sign In

1. Go to http://localhost:3000/auth/signin
2. Enter:
   - **Tenant Subdomain**: `domain`
   - **Email**: `manjushapaul391@gmail.com`
   - **Password**: `manjusha`
3. Click "Sign In"
4. You should be redirected to `/dashboard`

---

## 🔄 Password Reset Utility

To reset any user's password in the future:
```bash
node scripts/reset-password.js <email> <new-password>
```

Example:
```bash
node scripts/reset-password.js manjushapaul391@gmail.com newpassword123
```





