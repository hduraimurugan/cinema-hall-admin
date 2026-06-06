//services/api.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"

// ─── Hall-scoped fetch interceptor ──────────────────────────────────────────
// Reads the active hall ID from localStorage (written by HallContext) and
// automatically injects the X-Hall-Id header on every call.
// Use this instead of plain fetch() for any admin route protected by
// the requireActiveHall middleware on the backend.
const hallFetch = (url, options = {}) => {
  const hallId = localStorage.getItem("activeHallId")
  if (hallId) {
    options = {
      ...options,
      headers: {
        "X-Hall-Id": hallId,
        ...(options.headers || {}),
      },
    }
  }
  return fetch(url, options)
}
// ────────────────────────────────────────────────────────────────────────────

export const authAPI = {
  // ✅ Register a new cinema admin
  register: async (data) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    })
    const json = await response.json()
    if (!response.ok) throw Object.assign(new Error(json.error || "Registration failed"), { data: json })
    return json
  },

  // ✅ Login admin
  login: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    })
    const json = await response.json()
    if (!response.ok) throw Object.assign(new Error(json.error || "Login failed"), { data: json, status: response.status })
    return json
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

  // ✅ Update cinema hall details
  updateHall: async (data) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/hall`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.error || "Failed to update cinema hall")
    }
    return response.json()
  },

  // ✅ Verify email with token from link
  verifyEmail: async (token) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/verify-email?token=${encodeURIComponent(token)}`, {
      method: "GET",
      credentials: "include",
    })
    const json = await response.json()
    if (!response.ok) throw Object.assign(new Error(json.error || "Verification failed"), { data: json })
    return json
  },

  // ✅ Resend verification email
  resendVerification: async (email) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/resend-verification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email }),
    })
    const json = await response.json()
    if (!response.ok) throw new Error(json.error || "Failed to resend verification email")
    return json
  },

  // ✅ Forgot password — request reset link
  forgotPassword: async (email) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
    const json = await response.json()
    if (!response.ok) throw new Error(json.error || "Request failed")
    return json
  },

  // ✅ Reset password with token from link
  resetPassword: async (token, newPassword) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword }),
    })
    const json = await response.json()
    if (!response.ok) throw Object.assign(new Error(json.error || "Password reset failed"), { data: json })
    return json
  },

  // ✅ Change password (authenticated)
  changePassword: async (currentPassword, newPassword) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ currentPassword, newPassword }),
    })
    const json = await response.json()
    if (!response.ok) throw new Error(json.error || "Failed to change password")
    return json
  },

  // ✅ Logout from all devices
  logoutAllDevices: async () => {
    const response = await fetch(`${API_BASE_URL}/api/auth/logout-all`, {
      method: "POST",
      credentials: "include",
    })
    if (!response.ok) throw new Error("Failed to sign out from all devices")
    return response.json()
  },

  // ✅ Get security info (sessions, logs, etc.)
  getSecurityInfo: async () => {
    const response = await fetch(`${API_BASE_URL}/api/auth/security`, {
      method: "GET",
      credentials: "include",
    })
    if (!response.ok) throw new Error("Failed to load security info")
    return response.json()
  },

  // ✅ Google OAuth Login
  googleLogin: async (idToken) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/google-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ idToken }),
    })
    const json = await response.json()
    if (!response.ok) throw Object.assign(new Error(json.error || "Google login failed"), { data: json, status: response.status })
    return json
  },

  // ✅ GitHub OAuth Login
  githubLogin: async (code) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/github-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ code }),
    })
    const json = await response.json()
    if (!response.ok) throw Object.assign(new Error(json.error || "GitHub login failed"), { data: json, status: response.status })
    return json
  },

  // ✅ Link OAuth provider
  linkProvider: async (provider, { idToken, code } = {}) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/link-provider`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ provider, idToken, code }),
    })
    const json = await response.json()
    if (!response.ok) throw new Error(json.error || "Failed to link provider")
    return json
  },

  // ✅ Unlink OAuth provider
  unlinkProvider: async (provider) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/unlink-provider`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ provider }),
    })
    const json = await response.json()
    if (!response.ok) throw new Error(json.error || "Failed to unlink provider")
    return json
  },

  // ✅ Set password (for OAuth-only accounts)
  setPassword: async (newPassword) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/set-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ newPassword }),
    })
    const json = await response.json()
    if (!response.ok) throw new Error(json.error || "Failed to set password")
    return json
  },
}

export const screensAPI = {
  // ✅ Create a new screen
  createScreen: async (data) => {
    const response = await hallFetch(`${API_BASE_URL}/api/screens/create`, {
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
    const response = await hallFetch(`${API_BASE_URL}/api/screens`, {
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
    const response = await hallFetch(`${API_BASE_URL}/api/screens/update/${screenId}`, {
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
    const response = await hallFetch(`${API_BASE_URL}/api/screens/delete/${screenId}`, {
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

    // Handle multiple genres
    if (genre) {
      if (Array.isArray(genre)) {
        genre.forEach(g => params.append("genre", g))
      } else {
        params.append("genre", genre)
      }
    }

    // Handle multiple languages
    if (language) {
      if (Array.isArray(language)) {
        language.forEach(l => params.append("language", l))
      } else {
        params.append("language", language)
      }
    }

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

export const bookingAPI = {
  getCinemaHallBookings: async ({ from_date, to_date, search, status, screen_id, page = 1, limit = 10 } = {}) => {
    const params = new URLSearchParams();
    if (from_date) params.append("from_date", from_date);
    if (to_date) params.append("to_date", to_date);
    if (search) params.append("search", search);
    if (status) params.append("status", status);
    if (screen_id) params.append("screen_id", screen_id);
    params.append("page", page);
    params.append("limit", limit);
    const response = await hallFetch(`${API_BASE_URL}/api/booking/admin/all?${params}`, {
      credentials: "include",
    });
    if (!response.ok) {
      const e = await response.json();
      throw new Error(e.error || e.message || "Failed to fetch bookings");
    }
    return response.json();
  },

  verifyBooking: async (bookingId) => {
    const response = await hallFetch(`${API_BASE_URL}/api/booking/admin/verify/${bookingId}`, {
      credentials: "include",
    });
    if (!response.ok) {
      const e = await response.json();
      throw new Error(e.error || e.message || "Booking not found");
    }
    return response.json();
  },

  getBookingById: async (bookingId) => {
    const response = await hallFetch(`${API_BASE_URL}/api/booking/admin/verify/${bookingId}`, {
      credentials: "include",
    });
    if (!response.ok) {
      const e = await response.json();
      throw new Error(e.error || e.message || "Booking not found");
    }
    return response.json();
  },
};

export const showsAPI = {
  // ✅ Create a single show
  createShow: async (data) => {
    const response = await hallFetch(`${API_BASE_URL}/api/shows/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to create show");
    }

    return response.json();
  },

  // ✅ Create multiple shows (bulk)
  createMultipleShows: async (data) => {
    const response = await hallFetch(`${API_BASE_URL}/api/shows/bulk`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to create multiple shows");
    }

    return response.json();
  },

  // ✅ Edit a show
  editShow: async (showId, data) => {
    const response = await hallFetch(`${API_BASE_URL}/api/shows/edit/${showId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to edit show");
    }

    return response.json();
  },

  // ✅ Delete a show
  deleteShow: async (showId) => {
    const response = await hallFetch(`${API_BASE_URL}/api/shows/delete/${showId}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to delete show");
    }

    return response.json();
  },

  // ✅ Bulk delete shows
  deleteMultipleShows: async (ids) => {
    const response = await hallFetch(`${API_BASE_URL}/api/shows/bulk`, {
      method: "DELETE",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to delete shows");
    }

    return response.json();
  },

  // ✅ Get shows grouped by movie for a specific date
  getShowsByDate: async (date) => {
    const response = await hallFetch(`${API_BASE_URL}/api/shows/date/${date}`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to fetch shows");
    }

    return response.json();
  },

  // ✅ 🆕 Get a show by ID (with screen layout + movie + seat status)
  getShowById: async (showId) => {
    const response = await fetch(`${API_BASE_URL}/api/shows/get/${showId}`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to fetch show details");
    }

    return response.json();
  },

  // ✅ 🆕 Book seats for a show (lock in_booking)
  bookShow: async (showId, seats) => {
    const response = await fetch(`${API_BASE_URL}/api/shows/book/${showId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ seats }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to book seats");
    }

    return response.json();
  },

  // Get confirmed booking count + total refund amount for a show (used by cancel dialog)
  getShowBookingCount: async (showId) => {
    const response = await hallFetch(`${API_BASE_URL}/api/shows/booking-count/${showId}`, {
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch booking count");
    }

    return response.json();
  },

  // Cancel a show (marks bookings cancelled + initiates refunds)
  cancelShow: async (showId) => {
    const response = await hallFetch(`${API_BASE_URL}/api/shows/cancel/${showId}`, {
      method: "PUT",
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to cancel show");
    }

    return response.json();
  },

  // Open or revert booking status for a show
  updateBookingStatus: async (showId, action) => {
    const response = await hallFetch(`${API_BASE_URL}/api/shows/booking-status/${showId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ action }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to update booking status");
    }

    return response.json();
  },

  // Bulk cancel shows
  bulkCancelShows: async (ids) => {
    const response = await hallFetch(`${API_BASE_URL}/api/shows/bulk-cancel`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ ids }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to cancel shows");
    }

    return response.json();
  },

  // Bulk restore cancelled shows to scheduled
  bulkRestoreShows: async (ids) => {
    const response = await hallFetch(`${API_BASE_URL}/api/shows/bulk-restore`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ ids }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to restore shows");
    }

    return response.json();
  },

  // Bulk open booking for shows
  bulkOpenBooking: async (ids) => {
    const response = await hallFetch(`${API_BASE_URL}/api/shows/bulk-booking-open`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ ids }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to open booking for shows");
    }

    return response.json();
  },
};

export const adsAPI = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/api/ads`, {
      credentials: 'include',
    })
    if (!response.ok) throw await response.json()
    return response.json()
  },

  create: async (data) => {
    const response = await fetch(`${API_BASE_URL}/api/ads/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    })
    if (!response.ok) throw await response.json()
    return response.json()
  },

  update: async (id, data) => {
    const response = await fetch(`${API_BASE_URL}/api/ads/update/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    })
    if (!response.ok) throw await response.json()
    return response.json()
  },

  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/api/ads/delete/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    if (!response.ok) throw await response.json()
    return response.json()
  },

  getClicks: async (id) => {
    const response = await fetch(`${API_BASE_URL}/api/ads/${id}/clicks`, {
      credentials: 'include',
    })
    if (!response.ok) throw await response.json()
    return response.json()
  },
}

export const settingsAPI = {
  getSettings: async () => {
    const response = await fetch(`${API_BASE_URL}/api/settings`, {
      credentials: 'include',
    })
    if (!response.ok) throw await response.json()
    return response.json()
  },

  updateSettings: async (data) => {
    const response = await fetch(`${API_BASE_URL}/api/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    })
    if (!response.ok) throw await response.json()
    return response.json()
  },
}

export const offersAPI = {
  getCinemaHalls: async () => {
    const response = await fetch(`${API_BASE_URL}/api/offers/cinema-halls`, {
      credentials: 'include',
    })
    if (!response.ok) throw await response.json()
    return response.json()
  },

  getAll: async ({ scope, is_active, search, page = 1 } = {}) => {
    const params = new URLSearchParams()
    if (scope) params.set('scope', scope)
    if (is_active !== undefined && is_active !== '') params.set('is_active', is_active)
    if (search) params.set('search', search)
    params.set('page', page)
    const response = await fetch(`${API_BASE_URL}/api/offers?${params}`, {
      credentials: 'include',
    })
    if (!response.ok) throw await response.json()
    return response.json()
  },

  create: async (data) => {
    const response = await fetch(`${API_BASE_URL}/api/offers/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    })
    if (!response.ok) throw await response.json()
    return response.json()
  },

  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/api/offers/${id}`, {
      credentials: 'include',
    })
    if (!response.ok) throw await response.json()
    return response.json()
  },

  update: async (id, data) => {
    const response = await fetch(`${API_BASE_URL}/api/offers/update/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    })
    if (!response.ok) throw await response.json()
    return response.json()
  },

  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/api/offers/delete/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    if (!response.ok) throw await response.json()
    return response.json()
  },
}

export const customersAPI = {
  getAll: async ({ search, page = 1, limit = 10 } = {}) => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    params.set('page', page)
    params.set('limit', limit)
    const response = await fetch(`${API_BASE_URL}/api/customers?${params}`, {
      credentials: 'include',
    })
    if (!response.ok) throw await response.json()
    return response.json()
  },
  getDetails: async (id) => {
    const response = await fetch(`${API_BASE_URL}/api/customers/${id}`, {
      credentials: 'include',
    })
    if (!response.ok) throw await response.json()
    return response.json()
  },
}

export const adminsAPI = {
  getAll: async ({ search, page = 1, limit = 10 } = {}) => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    params.set('page', page)
    params.set('limit', limit)
    const response = await fetch(`${API_BASE_URL}/api/auth/admins?${params}`, {
      credentials: 'include',
    })
    if (!response.ok) throw await response.json()
    return response.json()
  },
  getLogs: async (id) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/admins/${id}/logs`, {
      credentials: 'include',
    })
    if (!response.ok) throw await response.json()
    return response.json()
  },
}

export const dashboardAPI = {
  getStats: async () => {
    const response = await hallFetch(`${API_BASE_URL}/api/dashboard/stats`, {
      credentials: 'include',
    })
    if (!response.ok) throw await response.json()
    return response.json()
  },
}

export const paymentAPI = {
  // ✅ Get all payment orders for the cinema hall (admin)
  getOrders: async ({ from_date, to_date, status, customer, movie, page = 1, limit = 10 } = {}) => {
    const params = new URLSearchParams()
    if (from_date) params.set("from_date", from_date)
    if (to_date) params.set("to_date", to_date)
    if (status && status !== "all") params.set("status", status)
    if (customer) params.set("customer", customer)
    if (movie) params.set("movie", movie)
    params.set("page", page)
    params.set("limit", limit)
    const response = await hallFetch(`${API_BASE_URL}/api/payment/admin/orders?${params}`, {
      credentials: "include",
    })
    if (!response.ok) throw await response.json()
    return response.json()
  },
};

export const tmdbAPI = {
  getPopular: async ({ page = 1, language = '' } = {}) => {
    const params = new URLSearchParams({ page })
    if (language) params.set('with_original_language', language)
    const response = await fetch(`${API_BASE_URL}/api/tmdb/popular?${params}`, { credentials: 'include' })
    if (!response.ok) throw await response.json()
    return response.json()
  },
  getNowPlaying: async ({ page = 1, language = '' } = {}) => {
    const params = new URLSearchParams({ page })
    if (language) params.set('with_original_language', language)
    const response = await fetch(`${API_BASE_URL}/api/tmdb/now-playing?${params}`, { credentials: 'include' })
    if (!response.ok) throw await response.json()
    return response.json()
  },
  getInTheatres: async ({ page = 1, language = '' } = {}) => {
    const params = new URLSearchParams({ page })
    if (language) params.set('with_original_language', language)
    const response = await fetch(`${API_BASE_URL}/api/tmdb/in-theatres?${params}`, { credentials: 'include' })
    if (!response.ok) throw await response.json()
    return response.json()
  },
  getUpcoming: async ({ page = 1, language = '' } = {}) => {
    const params = new URLSearchParams({ page })
    if (language) params.set('with_original_language', language)
    const response = await fetch(`${API_BASE_URL}/api/tmdb/upcoming?${params}`, { credentials: 'include' })
    if (!response.ok) throw await response.json()
    return response.json()
  },
  getTopRated: async ({ page = 1, language = '' } = {}) => {
    const params = new URLSearchParams({ page })
    if (language) params.set('with_original_language', language)
    const response = await fetch(`${API_BASE_URL}/api/tmdb/top-rated?${params}`, { credentials: 'include' })
    if (!response.ok) throw await response.json()
    return response.json()
  },
  search: async ({ query, page = 1, language = '' } = {}) => {
    const params = new URLSearchParams({ query, page })
    if (language) params.set('with_original_language', language)
    const response = await fetch(`${API_BASE_URL}/api/tmdb/search?${params}`, { credentials: 'include' })
    if (!response.ok) throw await response.json()
    return response.json()
  },
  getMovieDetails: async (tmdbId) => {
    const response = await fetch(`${API_BASE_URL}/api/tmdb/movie/${tmdbId}`, { credentials: 'include' })
    if (!response.ok) throw await response.json()
    return response.json()
  },
  getTmdbIds: async () => {
    const response = await fetch(`${API_BASE_URL}/api/movies/tmdb-ids`, { credentials: 'include' })
    if (!response.ok) throw await response.json()
    return response.json()
  },
};

export const refundAPI = {
  getRefunds: async ({ status, from_date, to_date, page = 1, limit = 10 } = {}) => {
    const params = new URLSearchParams()
    if (status && status !== "all") params.set("status", status)
    if (from_date) params.set("from_date", from_date)
    if (to_date) params.set("to_date", to_date)
    params.set("page", page)
    params.set("limit", limit)
    const response = await hallFetch(`${API_BASE_URL}/api/refunds?${params}`, { credentials: "include" })
    if (!response.ok) { const e = await response.json(); throw new Error(e.error || "Failed to fetch refunds") }
    return response.json()
  },

  getRefundByBooking: async (bookingId) => {
    const response = await hallFetch(`${API_BASE_URL}/api/refunds/booking/${bookingId}`, { credentials: "include" })
    if (!response.ok) { const e = await response.json(); throw new Error(e.error || "Refund not found") }
    return response.json()
  },

  settleRefund: async (refundId) => {
    const response = await hallFetch(`${API_BASE_URL}/api/refunds/${refundId}/settle`, {
      method: "POST",
      credentials: "include",
    })
    if (!response.ok) { const e = await response.json(); throw new Error(e.error || "Failed to settle refund") }
    return response.json()
  },
};

export const hallsAPI = {
  // GET /api/halls — list all halls owned by the logged-in admin
  getMyHalls: async () => {
    const response = await fetch(`${API_BASE_URL}/api/halls`, { credentials: "include" })
    if (!response.ok) { const e = await response.json(); throw new Error(e.message || "Failed to fetch halls") }
    return response.json()
  },

  // POST /api/halls — create a new hall
  createHall: async (data) => {
    const response = await fetch(`${API_BASE_URL}/api/halls`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    })
    if (!response.ok) { const e = await response.json(); throw new Error(e.message || "Failed to create hall") }
    return response.json()
  },

  // PUT /api/halls/:id — update hall details
  updateHall: async (id, data) => {
    const response = await fetch(`${API_BASE_URL}/api/halls/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    })
    if (!response.ok) { const e = await response.json(); throw new Error(e.message || "Failed to update hall") }
    return response.json()
  },

  // DELETE /api/halls/:id — delete hall (cascades to screens/shows/bookings)
  deleteHall: async (id) => {
    const response = await fetch(`${API_BASE_URL}/api/halls/${id}`, {
      method: "DELETE",
      credentials: "include",
    })
    if (!response.ok) { const e = await response.json(); throw new Error(e.message || "Failed to delete hall") }
    return response.json()
  },
};
