import { createClient } from "@supabase/supabase-js";

const env = import.meta.env || {};
export const supabaseUrl = (env.VITE_SUPABASE_URL || "").trim();
export const supabasePublicKey = (
  env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY || ""
).trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublicKey);

// Only a publishable/anon key is read here. Never put a service_role key in VITE_*.
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabasePublicKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;
