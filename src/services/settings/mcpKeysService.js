import { apiFetch, API_BASE_URL } from "../httpClient.js";

const unwrap = async (response) => {
  if (!response.ok) throw await response.json();
  return response.json();
};

const headers = { "Content-Type": "application/json" };

export const mcpKeysService = {
  getKeys: () =>
    apiFetch(`${API_BASE_URL}/api/api-keys`, { credentials: "include" }).then(unwrap),

  // Response includes `token` — the raw secret — exactly once. Never returned again.
  createKey: (data) =>
    apiFetch(`${API_BASE_URL}/api/api-keys`, {
      method: "POST",
      credentials: "include",
      headers,
      body: JSON.stringify(data),
    }).then(unwrap),

  revokeKey: (id) =>
    apiFetch(`${API_BASE_URL}/api/api-keys/${id}`, {
      method: "DELETE",
      credentials: "include",
    }).then(unwrap),
};
