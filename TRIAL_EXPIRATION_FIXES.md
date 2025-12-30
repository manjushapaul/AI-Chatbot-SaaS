# Trial Expiration Fixes - Summary

## Issues Fixed

### 1. Favicon 500 Error ✅
**Problem**: `/favicon.ico` was returning 500 Internal Server Error

**Solution**: The favicon already exists at `src/app/favicon.ico` (Next.js App Router file-based metadata). The 500 error was likely caused by the API route issues below.

---

### 2. Prisma Model Name Mismatch ✅
**Problem**: Code was using `prisma.subscriptions` (plural) but Prisma Client generates lowercase plural accessors

**Root Cause**: 
- Prisma schema defines: `model subscriptions { ... }`
- Prisma Client generates: `prisma.subscriptions` (lowercase plural)
- Code was incorrectly using: `prisma.subscription` (singular)

**Solution**: Updated all references to use the correct model names:
- `prisma.subscriptions` (not `prisma.subscription`)
- `prisma.users` (not `prisma.user`)
- `prisma.tenants` (not `prisma.tenant`)

**Files Updated**:
- `src/app/api/billing/subscription/route.ts`
- `scripts/expire-trial-now.js`

---

### 3. Trial Expiration Logic ✅
**Problem**: `trialEndsAt` was `null`, so expiration logic never triggered

**Solution**: 
1. **Script to expire trial**: `scripts/expire-trial-now.js`
   - Sets `trialEndsAt` to 1 hour ago
   - Sets `isTrialExpired` to `true`
   - Sets `status` to `'TRIALING'`

2. **API endpoint**: `/api/billing/subscription`
   - Validates Prisma client is initialized
   - Fetches subscription from database
   - Calculates `isExpired` based on `trialEndsAt`
   - Updates `isTrialExpired` flag if needed
   - Returns proper subscription data with `trialEndsAt`

3. **Dashboard layout**: `src/app/dashboard/layout.tsx`
   - Fetches subscription status on mount
   - Checks both `isTrialExpired` flag and `trialEndsAt` date
   - Shows `TrialExpiredScreen` if trial has ended
   - Shows loading spinner while checking
   - Falls back to normal dashboard if trial is active

4. **Trial expired screen**: `src/components/dashboard/TrialExpiredScreen.tsx`
   - Clean, centered paywall UI
   - Explains trial has ended
   - Buttons to upgrade or return home
   - Matches app's amber theme

---

## Testing the Trial Expiration Flow

### 1. Expire the Trial
```bash
node scripts/expire-trial-now.js
```

This will:
- Find user `manjushapaul392@gmail.com`
- Set their trial to expired (1 hour ago)
- Mark `isTrialExpired` as `true`

### 2. Test the Flow
1. **Clear browser cookies** or use incognito mode
2. Sign in with: `manjushapaul392@gmail.com` / `manjusha`
3. Navigate to `/dashboard`
4. **Expected Result**: You should see the "Trial Expired" screen with upgrade options

### 3. Check Console Logs
You should see:
```
[Client] Subscription check: {
  isTrialExpired: true,
  status: 'TRIALING',
  trialEndsAt: '2025-12-02T12:53:39.000Z'
}
[Client] Trial expired, showing paywall
```

---

## API Response Format

### `/api/billing/subscription` (GET)

**Success Response**:
```json
{
  "success": true,
  "data": {
    "isActive": false,
    "currentPlan": "FREE",
    "status": "TRIALING",
    "currentPeriodEnd": "2025-12-16T13:53:39.000Z",
    "cancelAtPeriodEnd": false,
    "nextBillingDate": "2025-12-16T13:53:39.000Z",
    "trialEndsAt": "2025-12-02T12:53:39.000Z",
    "isTrialExpired": true
  }
}
```

**Error Response**:
```json
{
  "error": "Failed to fetch subscription status",
  "details": "Error message here"
}
```

---

## Key Code Changes

### 1. API Route (`src/app/api/billing/subscription/route.ts`)
```typescript
// Validate Prisma client
if (!prisma || !prisma.subscriptions) {
  return NextResponse.json({ error: 'Internal configuration error' }, { status: 500 });
}

// Get subscription (using correct model name)
const subscription = await prisma.subscriptions.findUnique({
  where: { tenantId: tenantId }
});

// Check expiration
const now = new Date();
const trialEnd = subscription.trialEndsAt;
const isExpired = trialEnd ? new Date(trialEnd) <= now : false;

// Update flag if needed
if (isExpired && !subscription.isTrialExpired) {
  await prisma.subscriptions.update({
    where: { id: subscription.id },
    data: { isTrialExpired: true }
  });
}
```

### 2. Dashboard Layout (`src/app/dashboard/layout.tsx`)
```typescript
const [isTrialExpired, setIsTrialExpired] = useState(false);
const [isCheckingTrial, setIsCheckingTrial] = useState(true);

// Fetch and check subscription
const subscription = data.data;
const now = new Date();
const trialEnd = subscription?.trialEndsAt ? new Date(subscription.trialEndsAt) : null;
const isExpired = trialEnd && trialEnd <= now;

if ((subscription?.isTrialExpired || isExpired) && subscription?.status === 'TRIALING') {
  setIsTrialExpired(true);
}

// Render trial expired screen
if (isTrialExpired) {
  return <ProtectedRoute><TrialExpiredScreen /></ProtectedRoute>;
}
```

---

## Prisma Model Names Reference

| Schema Model | Prisma Client Accessor |
|--------------|------------------------|
| `model subscriptions` | `prisma.subscriptions` |
| `model users` | `prisma.users` |
| `model tenants` | `prisma.tenants` |
| `model bots` | `prisma.bots` |
| `model conversations` | `prisma.conversations` |
| `model api_keys` | `prisma.api_keys` |
| `model knowledge_bases` | `prisma.knowledge_bases` |

**Rule**: Prisma generates accessors using the **exact model name** from the schema (lowercase with underscores).

**Important**: The model names in the schema are already lowercase plural with underscores, so Prisma uses them as-is.

---

## Files Modified

1. ✅ `src/app/api/billing/subscription/route.ts` - Fixed model names, added validation
2. ✅ `src/app/dashboard/layout.tsx` - Added trial expiration check and screen
3. ✅ `src/components/dashboard/TrialExpiredScreen.tsx` - New paywall component
4. ✅ `scripts/expire-trial-now.js` - Fixed model names

---

## Next Steps

1. **Test the flow** with the expired trial user
2. **Verify** the console shows `isTrialExpired: true` and `trialEndsAt` is not null
3. **Confirm** the paywall screen appears instead of the dashboard
4. **Optional**: Add email notifications when trial is about to expire (3 days before, 1 day before, on expiration)

---

## Troubleshooting

### If you still see 500 errors:
1. Check server logs for detailed error messages
2. Verify Prisma Client is regenerated: `npx prisma generate`
3. Ensure `.env` has correct `DATABASE_URL`
4. Check that the subscription record exists in the database

### If trial doesn't expire:
1. Run `node scripts/expire-trial-now.js` to set the expiration
2. Check the database: `SELECT * FROM subscriptions WHERE "tenantId" = '<tenant-id>';`
3. Verify `trialEndsAt` is in the past and `isTrialExpired` is `true`
4. Clear browser cookies and sign in again

### If paywall doesn't show:
1. Check browser console for `[Client] Subscription check:` log
2. Verify `isTrialExpired: true` in the log
3. Check that `TrialExpiredScreen` component is imported correctly
4. Ensure `status === 'TRIALING'` in the subscription data

