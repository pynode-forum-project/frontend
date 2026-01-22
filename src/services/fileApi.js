const API_BASE_URL = "http://localhost:8080";

export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE_URL}/api/files/upload`, {
    method: "POST",
    body: formData,
    credentials: 'include'
  });

  const body = await res.json();
  
  if (!res.ok) {
    throw new Error(body?.message || body?.error || "Failed to upload file");
  }

  return body.url;
};
