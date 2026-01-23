const GATEWAY_BASE = "/api/auth";

import { apiFetch } from './request';

const MOCK = import.meta.env.VITE_MOCK_AUTH === 'true';

async function safeJson(res) {
  try {
    return await res.json();
  } catch (e) {
    return null;
  }
}

function normalizeBody(body) {
  if (!body || typeof body !== 'object') return body;

  // normalize `errors` -> `details`
  if (body.errors && !body.details && typeof body.errors === 'object') {
    body.details = body.errors;
    delete body.errors;
  }

  // normalize `error` (string) -> `message`
  if (body.error && !body.message) {
    body.message = body.error;
    // keep `details` if present
  }

  // prune details entries that are falsy/undefined
  if (body.details && typeof body.details === 'object') {
    const clean = {};
    Object.keys(body.details).forEach((k) => {
      const v = body.details[k];
      if (v !== undefined && v !== null && v !== '') clean[k] = v;
    });
    body.details = Object.keys(clean).length ? clean : undefined;
  }

  return body;
}

// small helper to simulate network latency in mock mode
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

export const login = async (data) => {
  if (MOCK) {
    // development mock: accept any non-empty email/password
    await delay(300);
    if (!data.email || !data.password) {
      return { ok: false, status: 400, body: { error: 'Email and password are required', details: { email: !data.email ? 'required' : undefined, password: !data.password ? 'required' : undefined } } };
    }
    return { ok: true, status: 200, body: { token: 'dev-jwt-token', user: { email: data.email } } };
  }

  const res = await apiFetch(`${GATEWAY_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  const body = await safeJson(res);
  return { ok: res.ok, status: res.status, body: normalizeBody(body) };
};

export const register = async (data) => {
  if (MOCK) {
    await delay(300);
    // simple validation mock
    const details = {};
    if (!data.firstName) details.firstName = 'First name is required.';
    if (!data.lastName) details.lastName = 'Last name is required.';
    if (!data.email) details.email = 'Email is required.';
    if (!data.password) details.password = 'Password is required.';
    if (Object.keys(details).length > 0) {
      return { ok: false, status: 400, body: { error: 'Validation failed', details } };
    }
    // simulate duplicate email
    if (data.email === 'exists@example.com') {
      return { ok: false, status: 409, body: { error: 'User with this email already exists' } };
    }
    return { ok: true, status: 201, body: { message: 'Registration successful', user_id: 'mock-id-123' } };
  }

  const res = await apiFetch(`${GATEWAY_BASE}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  const body = await safeJson(res);
  return { ok: res.ok, status: res.status, body: normalizeBody(body) };
};
