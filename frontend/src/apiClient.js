import { supabase } from './supabaseClient';

export async function apiGet(endpoint) {
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
    // Try to extract a meaningful error message from the response
    let errorMessage = 'API request failed';
    try {
      const err = await res.json();
      errorMessage = err.error || errorMessage;
    } catch {
      const errText = await res.text(); // fallback to plain text if not JSON
      errorMessage = errText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  return res.json();
}
