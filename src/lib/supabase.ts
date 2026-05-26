import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';

import { getSupabaseConfig, isSupabaseConfigured } from '@/lib/env';
import { canPersistAuthSession, getSupabaseAuthStorage } from '@/lib/supabaseStorage';

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Configure EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY no arquivo .env'
    );
  }

  if (!client) {
    const { url, anonKey } = getSupabaseConfig();
    const persist = canPersistAuthSession();

    client = createClient(url, anonKey, {
      auth: {
        storage: getSupabaseAuthStorage(),
        autoRefreshToken: persist,
        persistSession: persist,
        detectSessionInUrl: false,
      },
    });
  }

  return client;
}
