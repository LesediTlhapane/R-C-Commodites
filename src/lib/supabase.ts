import { createClient } from "@supabase/supabase-js";

// Read Supabase environment variables from Vite, with production fallback defaults
const DEFAULT_SUPABASE_URL = "https://rbcmjltpokzgkxitoljo.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "sb_publishable_siAm5B-hzfdAnBwDkwsBzg_5Lbp7vrZ";

const rawUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const rawKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

const supabaseUrl = rawUrl && !rawUrl.includes("your-project-id") ? rawUrl : DEFAULT_SUPABASE_URL;
const supabaseAnonKey = rawKey && !rawKey.includes("your-anon-key") ? rawKey : DEFAULT_SUPABASE_ANON_KEY;

/**
 * Validates whether Supabase environment variables are defined and not placeholders.
 */
export const isSupabaseConfigured = (): boolean => {
  return (
    Boolean(supabaseUrl) &&
    Boolean(supabaseAnonKey) &&
    supabaseUrl !== "https://placeholder.supabase.co" &&
    supabaseUrl.startsWith("http")
  );
};

if (!isSupabaseConfigured()) {
  console.warn(
    "[Supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not configured or using placeholders. Please add your real Supabase credentials to .env."
  );
}

/**
 * Reusable Supabase client for browser usage.
 * Uses ONLY the public anon key - never the service-role key.
 */
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
