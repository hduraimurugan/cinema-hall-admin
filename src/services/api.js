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
  getCinemaHallBookings: async ({ date, search, status, screen_id, page = 1 } = {}) => {
    const params = new URLSearchParams();
    if (date) params.append("date", date);
    if (search) params.append("search", search);
    if (status) params.append("status", status);
    if (screen_id) params.append("screen_id", screen_id);
    params.append("page", page);
    const response = await fetch(`${API_BASE_URL}/api/booking/admin/all?${params}`, {
      credentials: "include",
    });
    if (!response.ok) {
      const e = await response.json();
      throw new Error(e.error || e.message || "Failed to fetch bookings");
    }
    return response.json();
  },

  verifyBooking: async (bookingId) => {
    const response = await fetch(`${API_BASE_URL}/api/booking/admin/verify/${bookingId}`, {
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
    const response = await fetch(`${API_BASE_URL}/api/shows/create`, {
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
    const response = await fetch(`${API_BASE_URL}/api/shows/bulk`, {
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
    const response = await fetch(`${API_BASE_URL}/api/shows/edit/${showId}`, {
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
    const response = await fetch(`${API_BASE_URL}/api/shows/delete/${showId}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to delete show");
    }

    return response.json();
  },

  // ✅ Get shows grouped by movie for a specific date
  getShowsByDate: async (date) => {
    const response = await fetch(`${API_BASE_URL}/api/shows/date/${date}`, {
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

export const paymentAPI = {
  // ✅ Get all payment orders for the cinema hall (admin)
  getOrders: async ({ date, status, customer, movie, page = 1 } = {}) => {
    const params = new URLSearchParams()
    if (date) params.set("date", date)
    if (status && status !== "all") params.set("status", status)
    if (customer) params.set("customer", customer)
    if (movie) params.set("movie", movie)
    params.set("page", page)
    const response = await fetch(`${API_BASE_URL}/api/payment/admin/orders?${params}`, {
      credentials: "include",
    })
    if (!response.ok) throw await response.json()
    return response.json()
  },
};
