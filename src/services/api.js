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

export const moviesAPI = {
  // ✅ Add a new movie
  addMovie: async (data) => {
    const response = await fetch(`${API_BASE_URL}/api/movies/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Failed to add movie")
    }

    return response.json()
  },

  // ✅ Edit an existing movie
  editMovie: async (movieId, data) => {
    const response = await fetch(`${API_BASE_URL}/api/movies/edit/${movieId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Failed to edit movie")
    }

    return response.json()
  },

  // ✅ Delete a movie
  deleteMovie: async (movieId) => {
    const response = await fetch(`${API_BASE_URL}/api/movies/delete/${movieId}`, {
      method: "DELETE",
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Failed to delete movie")
    }

    return response.json()
  },

  // ✅ Get all movies with optional filters and pagination
  getAllMovies: async ({ page = 1, limit = 10, genre, language, status, release_date, search } = {}) => {
    const params = new URLSearchParams()

    // Add filters if provided
    if (page) params.append("page", page)
    if (limit) params.append("limit", limit)
    if (genre) params.append("genre", genre)
    if (language) params.append("language", language)
    if (status) params.append("status", status)
    if (release_date) params.append("release_date", release_date)
    if (search) params.append("search", search)

    const response = await fetch(`${API_BASE_URL}/api/movies?${params.toString()}`, {
      method: "GET",
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Failed to fetch movies")
    }

    return response.json()
  },

  // ✅ Get a specific movie by ID
  getMovieById: async (movieId) => {
    const response = await fetch(`${API_BASE_URL}/api/movies/${movieId}`, {
      method: "GET",
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Failed to fetch movie details")
    }

    return response.json()
  },

  // ✅ Update movie status
  updateStatus: async (movieId, status) => {
    const response = await fetch(`${API_BASE_URL}/api/movies/${movieId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ status }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Failed to update status")
    }

    return response.json()
  },
}
