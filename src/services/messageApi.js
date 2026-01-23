const API_BASE_URL = "http://localhost:8080";

async function safeJson(res) {
  try {
    return await res.json();
  } catch (e) {
    return null;
  }
}

function normalizeBody(body) {
  if (!body || typeof body !== 'object') return body;

  if (body.errors && !body.details && typeof body.errors === 'object') {
    body.details = body.errors;
    delete body.errors;
  }

  if (body.error && !body.message) {
    body.message = body.error;
  }

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

export const sendMessage = async (data) => {
  const res = await fetch(`${API_BASE_URL}/api/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: 'include'
  });
  const body = await safeJson(res);
  return { ok: res.ok, status: res.status, body: normalizeBody(body) };
};

export const getMessages = async (page = 1, perPage = 20, status = null) => {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("No authentication token found");
  }

  let url = `${API_BASE_URL}/api/messages?page=${page}&per_page=${perPage}`;
  if (status) {
    url += `&status=${status}`;
  }

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    credentials: 'include'
  });

  if (!res.ok) {
    const body = await safeJson(res);
    throw new Error(body?.message || `Failed to fetch messages: ${res.status}`);
  }

  const body = await safeJson(res);
  return body;
};
