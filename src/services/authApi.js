// services/authApi.js
export const login = async (data) => {
  return fetch("http://localhost:8080/users/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
};
