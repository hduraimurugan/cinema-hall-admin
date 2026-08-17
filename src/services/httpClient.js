const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"

/**
 * Called after a successful silent refresh so AuthContext can re-read the
 * user's permissions. Registered by AuthProvider — kept as a module-level hook
 * rather than a context value so plain service functions can trigger it.
 */
let onPermissionsChanged = null
export const setPermissionsChangedHandler = (fn) => { onPermissionsChanged = fn }

// One in-flight refresh shared by every caller. Without this, a page that
// fires six parallel requests would kick off six refreshes and race on the
// cookie the server sets.
let refreshInFlight = null

function refreshOnce() {
  if (!refreshInFlight) {
    refreshInFlight = fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
      .then(res => res.ok)
      .catch(() => false)
      .finally(() => {
        // Clear on the next tick so callers awaiting this promise all see the
        // same result before a new refresh can start.
        setTimeout(() => { refreshInFlight = null }, 0)
      })
  }
  return refreshInFlight
}

function withScopeHeaders(options = {}) {
  const hallId = localStorage.getItem("activeHallId")
  const orgId = localStorage.getItem("activeOrgId")
  const scopeHeaders = {
    ...(hallId ? { "X-Hall-Id": hallId } : {}),
    ...(orgId ? { "X-Org-Id": orgId } : {}),
  }
  if (Object.keys(scopeHeaders).length === 0) return options
  return { ...options, headers: { ...scopeHeaders, ...(options.headers || {}) } }
}

/**
 * fetch() for admin API calls: injects the active hall/org headers and
 * transparently recovers from a stale access token.
 *
 * When an owner edits a role, the server bumps that role's permissions_version
 * and every existing token for its members fails with 401 TOKEN_STALE. Rather
 * than dumping those users at the login screen mid-task, we mint a fresh token
 * and replay the request — the only visible effect is that their nav updates.
 */
export async function apiFetch(url, options = {}) {
  const opts = withScopeHeaders(options)
  const response = await fetch(url, opts)

  if (response.status !== 401) return response

  // Read from a clone so the original body stays available to the caller if
  // this turns out not to be a stale-token 401.
  let code
  try {
    code = (await response.clone().json())?.code
  } catch {
    return response
  }
  if (code !== "TOKEN_STALE") return response

  const refreshed = await refreshOnce()
  if (!refreshed) return response

  const retried = await fetch(url, withScopeHeaders(options))
  onPermissionsChanged?.()
  return retried
}

export { API_BASE_URL }
