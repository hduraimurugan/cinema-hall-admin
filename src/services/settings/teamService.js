import { apiFetch, API_BASE_URL } from "../httpClient.js";

const unwrap = async (response) => {
  if (!response.ok) throw await response.json();
  return response.json();
};

const headers = { "Content-Type": "application/json" };

export const teamService = {
  getMembers: (params) =>
    apiFetch(`${API_BASE_URL}/api/team?${params}`, { credentials: "include" }).then(unwrap),

  inviteMember: (data) =>
    apiFetch(`${API_BASE_URL}/api/team/invite`, {
      method: "POST",
      credentials: "include",
      headers,
      body: JSON.stringify(data),
    }).then(unwrap),

  createMember: (data) =>
    apiFetch(`${API_BASE_URL}/api/team/members`, {
      method: "POST",
      credentials: "include",
      headers,
      body: JSON.stringify(data),
    }).then(unwrap),

  getMember: (id) =>
    apiFetch(`${API_BASE_URL}/api/team/members/${id}`, { credentials: "include" }).then(unwrap),

  updateMember: (id, data) =>
    apiFetch(`${API_BASE_URL}/api/team/members/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers,
      body: JSON.stringify(data),
    }).then(unwrap),

  removeMember: (id) =>
    apiFetch(`${API_BASE_URL}/api/team/members/${id}`, {
      method: "DELETE",
      credentials: "include",
    }).then(unwrap),

  getMemberHalls: (id) =>
    apiFetch(`${API_BASE_URL}/api/team/members/${id}/halls`, { credentials: "include" }).then(unwrap),

  assignHalls: (id, halls) =>
    apiFetch(`${API_BASE_URL}/api/team/members/${id}/halls`, {
      method: "POST",
      credentials: "include",
      headers,
      body: JSON.stringify({ halls }),
    }).then(unwrap),

  removeHallAssignment: (memberId, hallId) =>
    apiFetch(`${API_BASE_URL}/api/team/members/${memberId}/halls/${hallId}`, {
      method: "DELETE",
      credentials: "include",
    }).then(unwrap),

  getRoles: () =>
    apiFetch(`${API_BASE_URL}/api/roles`, { credentials: "include" }).then(unwrap),

  // The full permission catalog straight from the DB — the role editor renders
  // only what this returns, so its options can never drift from the schema.
  getPermissionCatalog: () =>
    apiFetch(`${API_BASE_URL}/api/roles/permissions`, { credentials: "include" }).then(unwrap),

  getRole: (id) =>
    apiFetch(`${API_BASE_URL}/api/roles/${id}`, { credentials: "include" }).then(unwrap),

  createRole: (data) =>
    apiFetch(`${API_BASE_URL}/api/roles`, {
      method: "POST",
      credentials: "include",
      headers,
      body: JSON.stringify(data),
    }).then(unwrap),

  updateRole: (id, data) =>
    apiFetch(`${API_BASE_URL}/api/roles/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers,
      body: JSON.stringify(data),
    }).then(unwrap),

  deleteRole: (id) =>
    apiFetch(`${API_BASE_URL}/api/roles/${id}`, {
      method: "DELETE",
      credentials: "include",
    }).then(unwrap),

  cloneRole: (id, data) =>
    apiFetch(`${API_BASE_URL}/api/roles/${id}/clone`, {
      method: "POST",
      credentials: "include",
      headers,
      body: JSON.stringify(data),
    }).then(unwrap),
};
