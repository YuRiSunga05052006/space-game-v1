import type { User } from '@supabase/supabase-js';
import { getSupabase } from './supabaseClient';

export const DEFAULT_PLAYER_NAME = 'Player';
export const GUEST_ACCOUNT_LABEL = 'Guest';
export const MAX_PLAYER_NAME_LENGTH = 20;

export function sanitizePlayerName(raw: string): string {
  const next = raw.trim().replace(/\s+/g, ' ').slice(0, MAX_PLAYER_NAME_LENGTH);
  return next.length > 0 ? next : DEFAULT_PLAYER_NAME;
}

export function getPlayerName(user: User | null): string {
  if (!user) return DEFAULT_PLAYER_NAME;
  const raw = user.user_metadata?.player_name;
  if (typeof raw === 'string' && raw.trim().length > 0) {
    return sanitizePlayerName(raw);
  }
  return DEFAULT_PLAYER_NAME;
}

export async function setPlayerName(name: string): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return 'Cloud save is not configured.';
  const next = sanitizePlayerName(name);
  const { error } = await supabase.auth.updateUser({
    data: { player_name: next },
  });
  return error?.message ?? null;
}
