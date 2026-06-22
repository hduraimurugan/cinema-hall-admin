import { createContext, useContext, useCallback } from "react"
import { useAuth } from "./AuthContext"

const PermissionContext = createContext()

const MUTATION_ACTIONS = new Set(['create', 'update', 'delete', 'manage', 'cancel', 'settle', 'revoke', 'invite'])

export const PermissionProvider = ({ children }) => {
  const { user } = useAuth()

  const permissions = user?.permissions || []
  const roleKey = user?.roleKey || user?.role
  const isSuperAdmin = user?.role === 'superAdmin' || roleKey === 'owner' || user?.role === 'admin'

  const can = useCallback((permissionKey) => {
    if (isSuperAdmin) return true
    return permissions.includes(permissionKey)
  }, [permissions, isSuperAdmin])

  const hasRole = useCallback((...roles) => {
    return roles.includes(roleKey) || isSuperAdmin
  }, [roleKey, isSuperAdmin])

  const canView = useCallback((resource) => {
    return can(`${resource}.read`) || can(`${resource}.view`)
  }, [can])

  const canEdit = useCallback((resource) => {
    return permissions.some(p => {
      const [res] = p.split('.')
      const action = p.split('.')[1]
      return res === resource && MUTATION_ACTIONS.has(action)
    }) || isSuperAdmin
  }, [permissions, isSuperAdmin])

  return (
    <PermissionContext.Provider value={{ can, canView, canEdit, hasRole, permissions, roleKey }}>
      {children}
    </PermissionContext.Provider>
  )
}

export const usePermissions = () => useContext(PermissionContext)
