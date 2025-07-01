import { supabase } from './supabaseClient';

export async function apiGet(endpoint) {
  // Get the current session from Supabase
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) throw new Error('Not authenticated');

  const token = session.access_token;

  const res = await fetch(`https://thermoband-production.up.railway.app${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'API request failed');
  }

  return res.json();
}
