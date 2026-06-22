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

export const teamService = {
  getMembers: (params) =>
    fetch(`${API_BASE_URL}/api/team?${params}`, { credentials: "include" }).then(unwrap),

  inviteMember: (data) =>
    fetch(`${API_BASE_URL}/api/team/invite`, {
      method: "POST",
      credentials: "include",
      headers,
      body: JSON.stringify(data),
    }).then(unwrap),

  createMember: (data) =>
    fetch(`${API_BASE_URL}/api/team/members`, {
      method: "POST",
      credentials: "include",
      headers,
      body: JSON.stringify(data),
    }).then(unwrap),

  getMember: (id) =>
    fetch(`${API_BASE_URL}/api/team/members/${id}`, { credentials: "include" }).then(unwrap),

  updateMember: (id, data) =>
    fetch(`${API_BASE_URL}/api/team/members/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers,
      body: JSON.stringify(data),
    }).then(unwrap),

  removeMember: (id) =>
    fetch(`${API_BASE_URL}/api/team/members/${id}`, {
      method: "DELETE",
      credentials: "include",
    }).then(unwrap),

  getMemberHalls: (id) =>
    fetch(`${API_BASE_URL}/api/team/members/${id}/halls`, { credentials: "include" }).then(unwrap),

  assignHalls: (id, halls) =>
    fetch(`${API_BASE_URL}/api/team/members/${id}/halls`, {
      method: "POST",
      credentials: "include",
      headers,
      body: JSON.stringify({ halls }),
    }).then(unwrap),

  removeHallAssignment: (memberId, hallId) =>
    fetch(`${API_BASE_URL}/api/team/members/${memberId}/halls/${hallId}`, {
      method: "DELETE",
      credentials: "include",
    }).then(unwrap),

  getRoles: () =>
    fetch(`${API_BASE_URL}/api/roles`, { credentials: "include" }).then(unwrap),

  getRole: (id) =>
    fetch(`${API_BASE_URL}/api/roles/${id}`, { credentials: "include" }).then(unwrap),

  createRole: (data) =>
    fetch(`${API_BASE_URL}/api/roles`, {
      method: "POST",
      credentials: "include",
      headers,
      body: JSON.stringify(data),
    }).then(unwrap),

  updateRole: (id, data) =>
    fetch(`${API_BASE_URL}/api/roles/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers,
      body: JSON.stringify(data),
    }).then(unwrap),

  deleteRole: (id) =>
    fetch(`${API_BASE_URL}/api/roles/${id}`, {
      method: "DELETE",
      credentials: "include",
    }).then(unwrap),

  cloneRole: (id, data) =>
    fetch(`${API_BASE_URL}/api/roles/${id}/clone`, {
      method: "POST",
      credentials: "include",
      headers,
      body: JSON.stringify(data),
    }).then(unwrap),
};
