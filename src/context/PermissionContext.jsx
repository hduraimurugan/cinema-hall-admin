import { createContext, useContext, useCallback } from "react"
import { useAuth } from "./AuthContext"

const PermissionContext = createContext()

const MUTATION_ACTIONS = new Set(['create', 'update', 'delete', 'manage', 'cancel', 'settle', 'revoke', 'invite'])

export const PermissionProvider = ({ children }) => {
  const { user } = useAuth()

  const permissions = user?.permissions || []
  const roleKey = user?.roleKey || user?.role

  // Only the platform superAdmin bypasses permission checks. 'admin' is the
  // default DB role for every registered user, so including it here made
  // can() return true for everyone and disabled RBAC entirely. Org owners
  // need no bypass — the 'owner' role is seeded with every permission.
  const isSuperAdmin = user?.role === 'superAdmin'

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
