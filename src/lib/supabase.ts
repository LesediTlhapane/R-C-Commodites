import { createClient } from "@supabase/supabase-js";

// Read Supabase environment variables from Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

/**
 * Validates whether Supabase environment variables are defined and not placeholders.
 */
export const isSupabaseConfigured = (): boolean => {
  return (
    Boolean(supabaseUrl) &&
    Boolean(supabaseAnonKey) &&
    supabaseUrl !== "https://your-project-id.supabase.co" &&
    supabaseAnonKey !== "your-anon-key-here" &&
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
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
