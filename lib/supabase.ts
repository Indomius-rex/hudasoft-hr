import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL');
}

if (!key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
}

export const supabase =
  url && key
    ? createClient(url, key, {
        auth: {
          flowType: 'pkce',
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null;

export const demoEnabled =
  process.env.NEXT_PUBLIC_ENABLE_DEMO === 'true' ||
  (!url && process.env.NODE_ENV === 'development');