export async function apiFetch(path, options = {}) {
  const headers = options.headers ? { ...options.headers } : {};
  const token = localStorage.getItem('token');
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const opts = {
    credentials: 'include', // preserve existing cookie behavior
    ...options,
    headers,
  };

  return fetch(path, opts);
}
