import { apiFetch, API_BASE_URL } from "../httpClient.js";

const unwrap = async (response) => {
  if (!response.ok) throw await response.json();
  return response.json();
};

export const auditService = {
  getLogs: (params) =>
    apiFetch(`${API_BASE_URL}/api/audit-logs?${params}`, { credentials: "include" }).then(unwrap),
};
