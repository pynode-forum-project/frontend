export async function apiFetch(path, options = {}) {
  const headers = options.headers ? { ...options.headers } : {};
  let token = null;
  try {
    token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
  } catch (e) {
    token = null;
  }
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const opts = {
    credentials: 'include', // preserve existing cookie behavior
    ...options,
    headers,
  };

  return fetch(path, opts);
}

export async function safeJson(res) {
  if (!res || typeof res.json !== 'function') return null;
  try {
    const contentType = (res.headers && res.headers.get ? res.headers.get('content-type') : '') || '';
    if (!contentType.toLowerCase().includes('application/json')) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}
