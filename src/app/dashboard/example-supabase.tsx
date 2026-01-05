/**
 * Example Server Component using Supabase
 * This is an example file showing how to use Supabase in server components
 * You can use this pattern in your actual server components
 */

import { createClient } from '@/lib/supabase/server';

export default async function ExampleSupabasePage() {
  const supabase = await createClient();
  
  // Example: Query subscriptions table
  const { data: subscriptions, error } = await supabase
    .from('subscriptions')
    .select('*')
    .limit(10);

  if (error) {
    console.error('Supabase query error:', error);
    return <div>Error loading subscriptions</div>;
  }

  return (
    <div>
      <h1>Subscriptions (from Supabase)</h1>
      <pre>{JSON.stringify(subscriptions, null, 2)}</pre>
    </div>
  );
}




