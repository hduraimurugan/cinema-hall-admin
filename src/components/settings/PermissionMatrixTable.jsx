import { useState, useEffect } from "react"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Loader } from "@/components/Loader"
import { toast } from "sonner"
import { teamService } from "@/services/settings/teamService"

const RESOURCE_ACTIONS = {
  "movies": ["create", "read", "update", "delete"],
  "shows": ["create", "read", "update", "delete", "cancel"],
  "screens": ["create", "read", "update", "delete"],
  "bookings": ["create", "read", "update", "delete", "cancel"],
  "refunds": ["create", "read", "update", "approve"],
  "offers": ["create", "read", "update", "delete"],
  "ads": ["create", "read", "update", "delete"],
  "customers": ["read", "update"],
  "payment": ["read", "update", "settle"],
  "settings": ["read", "update"],
  "team": ["read", "manage", "invite"],
  "roles": ["read", "create", "update", "delete"],
  "audit": ["read"],
  "analytics": ["read"],
  "dashboard": ["read"],
  "verify-ticket": ["read"],
  "integrations": ["read", "update"],
  "billing": ["read", "update"],
}

export function PermissionMatrixTable({ roleId }) {
  const [permissions, setPermissions] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!roleId) return
    setLoading(true)
    teamService.getRole(roleId)
      .then((data) => {
        const role = data.role || data
        const perms = role.permissions || []
        const grouped = {}
        for (const p of perms) {
          const [res, action] = p.split(".")
          if (!grouped[res]) grouped[res] = {}
          grouped[res][action] = true
        }
        setPermissions(grouped)
      })
      .catch(() => toast.error("Failed to load role permissions"))
      .finally(() => setLoading(false))
  }, [roleId])

  const isResourceAllSelected = (resource) => {
    const actions = RESOURCE_ACTIONS[resource]
    if (!actions) return false
    return actions.every((a) => permissions[resource]?.[a])
  }

  const toggleResource = (resource, value) => {
    setPermissions((prev) => {
      const updated = { ...prev }
      if (value) {
        updated[resource] = {}
        for (const action of RESOURCE_ACTIONS[resource] || []) {
          updated[resource][action] = true
        }
      } else {
        delete updated[resource]
      }
      return updated
    })
  }

  const togglePermission = (resource, action, value) => {
    setPermissions((prev) => {
      const updated = { ...prev }
      if (!updated[resource]) updated[resource] = {}
      if (value) {
        updated[resource] = { ...updated[resource], [action]: true }
      } else {
        const { [action]: _, ...rest } = updated[resource]
        updated[resource] = Object.keys(rest).length ? rest : undefined
        if (!updated[resource]) delete updated[resource]
      }
      return updated
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const permList = []
      for (const [res, actions] of Object.entries(permissions)) {
        for (const action of Object.keys(actions || {})) {
          permList.push(`${res}.${action}`)
        }
      }
      await teamService.updateRole(roleId, { permissions: permList })
      toast.success("Permissions updated")
    } catch (err) {
      toast.error(err?.error || "Failed to update permissions")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {Object.entries(RESOURCE_ACTIONS).map(([resource, actions], idx) => (
        <div key={resource}>
          {idx > 0 && <Separator className="mb-6" />}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold capitalize">{resource.replace(/-/g, " ")}</h4>
              <Switch
                checked={isResourceAllSelected(resource)}
                onCheckedChange={(v) => toggleResource(resource, v)}
                className="scale-75"
              />
              <span className="text-[10px] text-muted-foreground">
                {isResourceAllSelected(resource) ? "All" : "Select all"}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {actions.map((action) => {
              const key = `${resource}.${action}`
              const checked = !!permissions[resource]?.[action]
              return (
                <label
                  key={key}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer transition-colors ${
                    checked
                      ? "border-primary/30 bg-primary/5"
                      : "border-border/50 hover:bg-muted/30"
                  }`}
                >
                  <Switch
                    checked={checked}
                    onCheckedChange={(v) => togglePermission(resource, action, v)}
                  />
                  <span className="text-xs capitalize">{action}</span>
                </label>
              )
            })}
          </div>
        </div>
      ))}

      <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
        <Button variant="outline" onClick={() => setPermissions({})}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Permissions"}
        </Button>
      </div>
    </div>
  )
}
