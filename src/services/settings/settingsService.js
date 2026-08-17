import { apiFetch, API_BASE_URL } from "../httpClient.js";

// Injects X-Hall-Id / X-Org-Id and silently recovers from a stale access token.
const hallFetch = apiFetch;

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
