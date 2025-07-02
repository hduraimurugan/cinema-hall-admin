const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"

export const authAPI = {
  // ✅ Register a new cinema admin
  register: async (data) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error("Registration failed")
    return response.json()
  },

  // ✅ Login admin
  login: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    })
    if (!response.ok) throw new Error("Login failed")
    return response.json()
  },

  // ✅ Logout admin
  logout: async () => {
    const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    })
    if (!response.ok) throw new Error("Logout failed")
    return response.json()
  },

  // ✅ Get current logged-in cinema admin
  getMe: async () => {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: "GET",
      credentials: "include",
    })
    if (!response.ok) throw new Error("Failed to fetch logged-in admin")
    return response.json()
  },

  // ✅ Refresh token
  refresh: async () => {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
    if (!response.ok) throw new Error("Token refresh failed")
    return response.json()
  },
}
