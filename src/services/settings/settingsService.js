const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const hallFetch = (url, options = {}) => {
  const hallId = localStorage.getItem("activeHallId");
  if (hallId) {
    options = { ...options, headers: { "X-Hall-Id": hallId, ...(options.headers || {}) } };
  }
  return fetch(url, options);
};

const unwrap = async (response) => {
  if (!response.ok) throw await response.json();
  return response.json();
};

const headers = { "Content-Type": "application/json" };

export const settingsService = {
  // ── Organization-level ──────────────────────────────────────────
  getOrgSettings: () =>
    fetch(`${API_BASE_URL}/api/settings/org`, { credentials: "include" }).then(unwrap),

  updateOrgSettings: (section, patch) =>
    fetch(`${API_BASE_URL}/api/settings/org`, {
      method: "PATCH",
      credentials: "include",
      headers,
      body: JSON.stringify({ section, patch }),
    }).then(unwrap),

  // ── Hall-level ──────────────────────────────────────────────────
  getHallSettings: (hallId) =>
    hallFetch(`${API_BASE_URL}/api/settings/hall/${hallId}`, { credentials: "include" }).then(unwrap),

  updateHallSettings: (hallId, section, patch) =>
    hallFetch(`${API_BASE_URL}/api/settings/hall/${hallId}`, {
      method: "PATCH",
      credentials: "include",
      headers,
      body: JSON.stringify({ section, patch }),
    }).then(unwrap),

  // ── User-level ──────────────────────────────────────────────────
  getUserSettings: () =>
    fetch(`${API_BASE_URL}/api/settings/user`, { credentials: "include" }).then(unwrap),

  updateUserSettings: (section, patch) =>
    fetch(`${API_BASE_URL}/api/settings/user`, {
      method: "PATCH",
      credentials: "include",
      headers,
      body: JSON.stringify({ section, patch }),
    }).then(unwrap),
};
