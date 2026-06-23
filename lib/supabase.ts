import { createClient } from "@supabase/supabase-js";

// Browser Supabase client. Auth state + entries/saved are scoped per user by
// row-level security (see supabase/schema.sql). The publishable/anon key is safe
// to ship to the browser; the service-role key is NOT used here.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const supabaseConfigured = Boolean(url && key);

// Fall back to harmless placeholders so importing this module never throws when
// env vars are missing — `supabaseConfigured` gates the UI instead.
export const supabase = createClient(
  url ?? "https://placeholder.supabase.co",
  key ?? "placeholder-anon-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);
