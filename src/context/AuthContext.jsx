import { createContext, useContext, useEffect, useState } from "react"
import { authAPI } from "../services/api.js"

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [cinemaHall, setCinemaHall] = useState(null)
  const [loading, setLoading] = useState(true)

  // 🔄 Load session on mount
  useEffect(() => {
    const initializeSession = async () => {
      const fetchUser = async () => {
        try {
          const res = await authAPI.getMe()
          setUser(res.admin)
          setCinemaHall(res.hall)
          return true
        } catch {
          return false
        }
      }

      const gotUser = await fetchUser()

      if (!gotUser) {
        try {
          const refreshRes = await authAPI.refresh()
          if (refreshRes.success) {
            const retried = await fetchUser()
            if (!retried) setUser(null)
          } else {
            setUser(null)
          }
        } catch {
          setUser(null)
        }
      }

      setLoading(false)
    }

    initializeSession()
  }, [])

  // ✅ Login
  const login = async (email, password) => {
    try {
      const res = await authAPI.login(email, password)
      setUser(res.admin)
      setCinemaHall(res.hall)
      return { success: true, admin: res.admin }
    } catch (err) {
      return { success: false, message: err.message }
    }
  }

  // ✅ Logout
  const logout = async () => {
    try {
      await authAPI.logout()
      setUser(null)
      setCinemaHall(null)
    } catch (err) {
      console.error("Logout failed:", err)
    }
  }

  // ✅ Register
  const register = async (data) => {
    try {
      const res = await authAPI.register(data)
      return { success: true, admin: res.admin }
    } catch (err) {
      return { success: false, message: err.message }
    }
  }

  const value = {
    user,
    cinemaHall,
    isLoggedIn: !!user,
    loading,
    login,
    logout,
    register,
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
