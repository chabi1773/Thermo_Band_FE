// src/apiClient.js
export async function apiGet(endpoint) {
  const token = localStorage.getItem('supabaseToken');
  if (!token) throw new Error('No auth token found');

  const res = await fetch(`http://localhost:5000${endpoint}`, {
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
