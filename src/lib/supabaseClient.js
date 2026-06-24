import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// True once you've created .env with real Supabase credentials.
export const isSupabaseConfigured = Boolean(url && anonKey);

// In demo mode (no .env yet) this client is never actually called,
// but we still need a non-throwing placeholder so imports don't crash.
export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey)
  : createClient("https://placeholder.supabase.co", "placeholder-key");

/**
 * Signs in with email/password and returns the user's profile row
 * (full_name, role, etc.) from the `profiles` table.
 */
export async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", data.user.id)
    .single();
  if (profileError) throw profileError;

  return { ...profile, email: data.user.email };
}

/** Returns the currently signed-in user's profile, or null if no session. */
export async function getCurrentProfile() {
  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData?.session;
  if (!session) return null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .single();
  if (error) return null;

  return { ...profile, email: session.user.email };
}

export async function signOut() {
  await supabase.auth.signOut();
}