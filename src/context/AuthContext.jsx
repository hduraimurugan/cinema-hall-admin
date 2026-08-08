import { createContext, useContext, useEffect, useState } from "react"
import { authAPI } from "../services/api.js"

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [cinemaHall, setCinemaHall] = useState(null)
  const [loading, setLoading] = useState(true)
  const isSuperAdmin = user?.role === 'superAdmin'

  // Mirror the active org into localStorage so the fetch interceptors can
  // attach X-Org-Id without threading React context through every service.
  useEffect(() => {
    if (user?.orgId) {
      localStorage.setItem("activeOrgId", user.orgId)
    } else {
      localStorage.removeItem("activeOrgId")
    }
  }, [user?.orgId])

  // 🔄 Load session on mount
  useEffect(() => {
    const initializeSession = async () => {
      const fetchUser = async () => {
        try {
          const res = await authAPI.getMe()
          // orgId, roleKey and permissions live on res.admin — reading them from
          // the top level overwrote the real values with undefined.
          setUser(prev => ({...prev, ...res.admin, permissions: res.admin?.permissions || []}))
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
      setUser(prev => ({...prev, ...res.admin, permissions: res.admin?.permissions || []}))
      setCinemaHall(res.hall)
      return { success: true, admin: res.admin, hall: res.hall ?? null }
    } catch (err) {
      return { success: false, message: err.message, data: err.data }
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
      return { success: true, admin: res.admin, message: res.message }
    } catch (err) {
      return { success: false, message: err.message }
    }
  }

  // ✅ Update cinema hall
  const updateHall = async (data) => {
    try {
      const res = await authAPI.updateHall(data)
      setCinemaHall(res.hall)
      return { success: true, hall: res.hall }
    } catch (err) {
      return { success: false, message: err.message }
    }
  }

  // ✅ Change password
  const changePassword = async (currentPassword, newPassword) => {
    try {
      const res = await authAPI.changePassword(currentPassword, newPassword)
      return { success: true, message: res.message }
    } catch (err) {
      return { success: false, message: err.message }
    }
  }

  // ✅ Logout all devices
  const logoutAllDevices = async () => {
    try {
      await authAPI.logoutAllDevices()
      setUser(null)
      setCinemaHall(null)
      return { success: true }
    } catch (err) {
      return { success: false, message: err.message }
    }
  }

  // ✅ Google OAuth Login
  const googleLogin = async (idToken) => {
    try {
      const res = await authAPI.googleLogin(idToken)
      setUser({...res.admin, permissions: res.admin?.permissions || []})
      setCinemaHall(res.hall)
      return { success: true, admin: res.admin, hall: res.hall ?? null }
    } catch (err) {
      return { success: false, message: err.message, data: err.data }
    }
  }

  // ✅ GitHub OAuth Login
  const githubLogin = async (code) => {
    try {
      const res = await authAPI.githubLogin(code)
      setUser({...res.admin, permissions: res.admin?.permissions || []})
      setCinemaHall(res.hall)
      return { success: true, admin: res.admin, hall: res.hall ?? null }
    } catch (err) {
      return { success: false, message: err.message, data: err.data }
    }
  }

  // ✅ Refresh user data
  const refreshUser = async () => {
    try {
      const res = await authAPI.getMe()
      setUser(prev => ({...prev, ...res.admin, permissions: res.admin?.permissions || []}))
      setCinemaHall(res.hall)
    } catch {
      // ignore
    }
  }

  const value = {
    user,
    cinemaHall,
    isSuperAdmin,
    isLoggedIn: !!user,
    emailVerified: user?.email_verified ?? false,
    loading,
    login,
    logout,
    register,
    updateHall,
    changePassword,
    logoutAllDevices,
    googleLogin,
    githubLogin,
    refreshUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
