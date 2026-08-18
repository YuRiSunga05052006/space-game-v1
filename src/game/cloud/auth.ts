import type { User } from '@supabase/supabase-js';
import { getSupabase, isSupabaseConfigured } from './supabaseClient';
import { pullAndMergeProgress, flushProgressToCloud } from './progressSync';
import { DEFAULT_PLAYER_NAME } from './playerName';

export function getAuthUnavailableReason(): string | null {
  if (!isSupabaseConfigured()) {
    return 'Cloud save is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to .env.local.';
  }
  return null;
}

export async function getCurrentUser(): Promise<User | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user ?? null;
}

export function isDeveloperAccount(user: User | null): boolean {
  return user?.app_metadata?.developer === true;
}

export function onAuthChange(callback: (user: User | null) => void): () => void {
  const supabase = getSupabase();
  if (!supabase) return () => undefined;
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });
  return () => data.subscription.unsubscribe();
}

export async function signInWithEmail(email: string, password: string): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return getAuthUnavailableReason();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return error.message;
  await pullAndMergeProgress();
  return null;
}

export async function signUpWithEmail(email: string, password: string): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return getAuthUnavailableReason();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: window.location.origin,
      data: { player_name: DEFAULT_PLAYER_NAME },
    },
  });
  if (error) return error.message;
  if (!data.session) {
    return 'Account created. Check your email to confirm, then sign in.';
  }
  await pullAndMergeProgress();
  return null;
}

export async function signOut(): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return getAuthUnavailableReason();
  await flushProgressToCloud();
  const { error } = await supabase.auth.signOut();
  return error?.message ?? null;
}
