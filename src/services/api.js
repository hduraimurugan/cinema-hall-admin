//services/api.js
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

export const screensAPI = {
  // ✅ Create a new screen
  createScreen: async (data) => {
    const response = await fetch(`${API_BASE_URL}/api/screens/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Failed to create screen")
    }

    return response.json()
  },

  // ✅ Get all screens for the current admin's cinema hall
  getMyScreens: async () => {
    const response = await fetch(`${API_BASE_URL}/api/screens`, {
      method: "GET",
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Failed to fetch screens")
    }

    return response.json()
  },

  // ✅ Update an existing screen by ID
  updateScreen: async (screenId, data) => {
    const response = await fetch(`${API_BASE_URL}/api/screens/update/${screenId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Failed to update screen")
    }

    return response.json()
  },

  // ✅ Delete a screen by ID
  deleteScreen: async (screenId) => {
    const response = await fetch(`${API_BASE_URL}/api/screens/delete/${screenId}`, {
      method: "DELETE",
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Failed to delete screen")
    }

    return response.json()
  },
}