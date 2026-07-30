export const API_BASE = '/api';

export async function apiFetch(endpoint, options = {}) {
  const authPin = sessionStorage.getItem('openphonebook_pin') || '';
  
  const headers = {
    'Content-Type': 'application/json',
    ...(authPin ? { 'X-Auth-PIN': authPin } : {}),
    ...(options.headers || {})
  };

  // Do not set Content-Type if body is FormData (not used currently, but good practice)
  if (options.body && options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const config = {
    ...options,
    headers
  };

  const res = await fetch(`${API_BASE}${endpoint}`, config);
  
  if (!res.ok) {
    let errMsg = 'Network error or unauthorized';
    try {
      const errData = await res.json();
      errMsg = errData.error || errMsg;
    } catch (e) {
      // Failed to parse JSON error
    }
    throw new Error(errMsg);
  }
  
  // Return null for 204 No Content
  if (res.status === 204) return null;
  
  return await res.json();
}
