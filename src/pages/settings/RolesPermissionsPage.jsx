import { useState, useEffect, useRef } from "react"
import { SettingsPageHeader } from "@/components/settings/SettingsPageHeader"
import { SettingsCard } from "@/components/settings/SettingsCard"
import { Badge } from "@/components/ui/badge"
import { Loader } from "@/components/Loader"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { teamService } from "@/services/settings/teamService"
import { usePermissions } from "@/context/PermissionContext"
import { PermissionMatrixTable } from "@/components/settings/PermissionMatrixTable"
import { CreateRoleDialog } from "@/components/settings/CreateRoleDialog"
import { Shield, ShieldAlert, Lock } from "lucide-react"

export function RolesPermissionsPage() {
  const { can } = usePermissions()
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedRoleId, setSelectedRoleId] = useState(null)
  const [createOpen, setCreateOpen] = useState(false)

  const canManage = can("roles.manage")

  const fetchRoles = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await teamService.getRoles()
      setRoles(data.roles || [])
    } catch (err) {
      setError(err?.error || "Failed to load roles")
      toast.error(err?.error || "Failed to load roles")
    } finally {
      setLoading(false)
    }
  }

  const editorRef = useRef(null)

  useEffect(() => {
    fetchRoles()
  }, [])

  // The editor renders under a grid of eight role cards, so on most screens a
  // click would otherwise appear to do nothing at all.
  useEffect(() => {
    if (!selectedRoleId) return
    editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [selectedRoleId])

  const selectedRole = roles.find((r) => r.id === selectedRoleId)
  // The owner role is the org's recovery path — the API rejects permission
  // edits to it, so the editor must not pretend otherwise.
  const isOwnerRole = selectedRole?.key === "owner"
  const editorReadOnly = !canManage || isOwnerRole

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <SettingsPageHeader
          icon={Shield}
          title="Roles & Permissions"
          description="Choose which pages each role can view and edit"
          scope="org"
        />
        {canManage && (
          <CreateRoleDialog
            open={createOpen}
            onOpenChange={setCreateOpen}
            onSuccess={fetchRoles}
          />
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ShieldAlert className="h-10 w-10 text-destructive mb-3" />
          <p className="text-sm text-destructive font-medium">{error}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={fetchRoles}>
            Try again
          </Button>
        </div>
      ) : roles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Shield className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground font-medium">No roles defined</p>
          <p className="text-xs text-muted-foreground mt-1">
            Create custom roles to define permissions for your team.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role) => {
            const active = selectedRoleId === role.id
            return (
              // A real <button>, not a SettingsCard — that component drops the
              // onClick it is handed, so the cards were inert and the editor
              // below could never be opened.
              <button
                key={role.id}
                type="button"
                aria-pressed={active}
                onClick={() => setSelectedRoleId(active ? null : role.id)}
                className={`w-full text-left rounded-xl border bg-card/80 backdrop-blur-sm p-5 shadow-sm transition-all duration-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                  active
                    ? "ring-2 ring-primary border-primary/40"
                    : "border-border/60 hover:border-border"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold flex items-center gap-1.5">
                      {role.key === "owner" && <Lock className="h-3 w-3 text-primary shrink-0" />}
                      {role.label || role.name}
                    </h3>
                    <Badge variant="outline" className="text-[10px] font-mono shrink-0">
                      {role.key}
                    </Badge>
                  </div>
                  {role.description && (
                    <p className="text-xs text-muted-foreground">{role.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">
                      {role.member_count || 0} members
                    </Badge>
                    <Badge variant="secondary" className="text-[10px]">
                      {role.permission_count || 0} permissions
                    </Badge>
                    {role.is_system && (
                      <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">
                        System
                      </Badge>
                    )}
                  </div>
                  <p className={`text-[11px] font-medium ${active ? "text-primary" : "text-muted-foreground/70"}`}>
                    {active ? "Editing below ↓" : "Click to edit pages"}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {selectedRoleId && (
        <div ref={editorRef} className="scroll-mt-4">
        <SettingsCard
          title={`Permissions — ${selectedRole?.label || ""}`}
          description={
            isOwnerRole
              ? "The Owner role always has full access and cannot be edited."
              : "Tick the pages this role can view and what it can do on each."
          }
        >
          <PermissionMatrixTable
            key={selectedRoleId}
            roleId={selectedRoleId}
            readOnly={editorReadOnly}
            onSaved={fetchRoles}
          />
        </SettingsCard>
        </div>
      )}
    </div>
  )
}
