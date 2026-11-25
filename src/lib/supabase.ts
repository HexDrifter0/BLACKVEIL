import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// The publishable key is intentionally public. Row Level Security protects every
// exposed table; never place a Supabase secret/service_role key in this bundle.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://robmzfodqbijekqxrhyd.supabase.co'
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_xtDfqspSCdNw09l-y4GyKg_XCZDtxOK'

let client: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null
  if (!client) client = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  })
  return client
}
