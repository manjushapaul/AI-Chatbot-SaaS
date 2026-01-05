# Testing Trial Expiration

This guide shows you how to test the trial expiration workflow.

## Method 1: Using the Test Script (Easiest)

Run the simple test script to automatically expire the first active trial:

```bash
node scripts/test-trial-expiration-simple.js
```

This will:
- Find all active trials
- Expire the first one (set `trialEndsAt` to 1 day ago)
- Set `isTrialExpired` to `true`

## Method 2: Using Prisma Studio (Visual)

1. Open Prisma Studio:
   ```bash
   npx prisma studio
   ```

2. Navigate to the `Subscription` model
3. Find the subscription you want to test
4. Edit the `trialEndsAt` field:
   - **To expire immediately**: Set to a past date (e.g., `2024-01-01T00:00:00Z`)
   - **To expire in 1 hour**: Set to `new Date(Date.now() + 60 * 60 * 1000)`
   - **To reset to 14 days**: Set to `new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)`
5. Set `isTrialExpired` to `true` if setting a past date
6. Click "Save"

## Method 3: Direct SQL Query

Connect to your PostgreSQL database and run:

### Expire immediately (for testing):
```sql
UPDATE "subscriptions" 
SET 
  "trialEndsAt" = NOW() - INTERVAL '1 day',
  "isTrialExpired" = true 
WHERE "status" = 'TRIALING' 
  AND "trialEndsAt" IS NOT NULL
LIMIT 1;
```

### Expire in 1 hour (for testing soon):
```sql
UPDATE "subscriptions" 
SET 
  "trialEndsAt" = NOW() + INTERVAL '1 hour',
  "isTrialExpired" = false 
WHERE "status" = 'TRIALING' 
  AND "trialEndsAt" IS NOT NULL
LIMIT 1;
```

### Reset to 14 days (restore trial):
```sql
UPDATE "subscriptions" 
SET 
  "trialEndsAt" = NOW() + INTERVAL '14 days',
  "isTrialExpired" = false 
WHERE "status" = 'TRIALING';
```

## Method 4: Using Node.js REPL

```bash
node
```

Then in the REPL:
```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Find subscription
const sub = await prisma.subscription.findFirst({
  where: { status: 'TRIALING' },
  include: { tenant: true }
});

// Expire it
await prisma.subscription.update({
  where: { id: sub.id },
  data: {
    trialEndsAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    isTrialExpired: true
  }
});

console.log('Trial expired!');
await prisma.$disconnect();
```

## Testing the Flow

After modifying the trial expiration:

1. **Clear your browser cookies/session** (or use incognito mode)
2. **Sign in** with the account that has the expired trial
3. **Try to access `/dashboard`** - you should be redirected to `/billing/expired`
4. **Test the upgrade flow** - click "Upgrade to Pro" and verify Stripe checkout opens
5. **Test the downgrade flow** - click "Continue with Free Plan" and verify it works

## Verify Trial Status

Check if a trial is expired:
```sql
SELECT 
  id,
  "tenantId",
  status,
  "trialEndsAt",
  "isTrialExpired",
  CASE 
    WHEN "trialEndsAt" <= NOW() THEN 'EXPIRED'
    ELSE 'ACTIVE'
  END as trial_status
FROM "subscriptions"
WHERE status = 'TRIALING';
```

## Reset After Testing

To reset a trial back to active:
```sql
UPDATE "subscriptions" 
SET 
  "trialEndsAt" = NOW() + INTERVAL '14 days',
  "isTrialExpired" = false 
WHERE id = '<subscription-id>';
```





