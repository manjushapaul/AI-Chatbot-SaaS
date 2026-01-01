# Supabase Client Setup Guide

## ✅ Installation Complete

The Supabase client packages have been installed:
- `@supabase/supabase-js` - Supabase JavaScript client
- `@supabase/ssr` - Supabase SSR (Server-Side Rendering) support for Next.js

---

## 📁 Files Created

### 1. Server Components: `src/lib/supabase/server.ts`
Use this for Server Components and API routes.

```typescript
import { createClient } from '@/lib/supabase/server';

// In a Server Component or API route
const supabase = await createClient();
const { data } = await supabase.from('subscriptions').select();
```

### 2. Client Components: `src/lib/supabase/client.ts`
Use this for Client Components (components with 'use client').

```typescript
import { createClient } from '@/lib/supabase/client';

// In a Client Component
const supabase = createClient();
const { data } = await supabase.from('subscriptions').select();
```

---

## 🔧 Environment Variables

Add these to your `.env.local` file:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"
```

### How to Get These Values:

1. **Go to Supabase Dashboard**: https://app.supabase.com
2. **Select your project**
3. **Go to Settings** → **API**
4. **Copy:**
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 📝 Usage Examples

### Example 1: Server Component

```typescript
// app/dashboard/subscriptions/page.tsx
import { createClient } from '@/lib/supabase/server';

export default async function SubscriptionsPage() {
  const supabase = await createClient();
  
  const { data: subscriptions, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('status', 'ACTIVE')
    .limit(10);

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div>
      <h1>Active Subscriptions</h1>
      {subscriptions?.map(sub => (
        <div key={sub.id}>{sub.plan}</div>
      ))}
    </div>
  );
}
```

### Example 2: API Route

```typescript
// app/api/subscriptions/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
```

### Example 3: Client Component

```typescript
// components/SubscriptionList.tsx
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function SubscriptionList() {
  const [subscriptions, setSubscriptions] = useState([]);
  const supabase = createClient();

  useEffect(() => {
    async function fetchSubscriptions() {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*');

      if (!error && data) {
        setSubscriptions(data);
      }
    }

    fetchSubscriptions();
  }, []);

  return (
    <div>
      {subscriptions.map(sub => (
        <div key={sub.id}>{sub.plan}</div>
      ))}
    </div>
  );
}
```

---

## 🔐 Authentication with Supabase

If you want to use Supabase Auth instead of NextAuth:

```typescript
// Server Component
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();

// Client Component
const supabase = createClient();
const { data: { user } } = await supabase.auth.getUser();
```

---

## 📊 Common Queries

### Select with filters:
```typescript
const { data } = await supabase
  .from('subscriptions')
  .select('*')
  .eq('status', 'ACTIVE')
  .gte('currentPeriodEnd', new Date().toISOString());
```

### Insert:
```typescript
const { data, error } = await supabase
  .from('subscriptions')
  .insert({ plan: 'PROFESSIONAL', status: 'ACTIVE' });
```

### Update:
```typescript
const { data, error } = await supabase
  .from('subscriptions')
  .update({ status: 'CANCELED' })
  .eq('id', subscriptionId);
```

### Delete:
```typescript
const { error } = await supabase
  .from('subscriptions')
  .delete()
  .eq('id', subscriptionId);
```

---

## ⚠️ Important Notes

1. **Server vs Client**: 
   - Use `server.ts` for Server Components and API routes
   - Use `client.ts` for Client Components

2. **Environment Variables**:
   - Must start with `NEXT_PUBLIC_` to be accessible in client components
   - Don't expose service role keys in client components

3. **Row Level Security (RLS)**:
   - Make sure RLS policies are set up in Supabase
   - The anon key respects RLS policies

4. **Database vs Supabase Client**:
   - You're currently using Prisma for database operations
   - Supabase client can be used for:
     - Real-time subscriptions
     - Storage operations
     - Authentication (if switching from NextAuth)
     - Direct queries when needed

---

## 🚀 Next Steps

1. **Add environment variables** to `.env.local`
2. **Test the connection** using the example component
3. **Set up RLS policies** in Supabase if needed
4. **Use Supabase client** for real-time features or storage

---

## 📚 Resources

- [Supabase JavaScript Client Docs](https://supabase.com/docs/reference/javascript/introduction)
- [Supabase SSR Guide](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [Next.js with Supabase](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)


