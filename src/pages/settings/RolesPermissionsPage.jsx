import { useState, useEffect } from "react"
import { SettingsPageHeader } from "@/components/settings/SettingsPageHeader"
import { SettingsCard } from "@/components/settings/SettingsCard"
import { Badge } from "@/components/ui/badge"
import { Loader } from "@/components/Loader"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { teamService } from "@/services/settings/teamService"
import { PermissionMatrixTable } from "@/components/settings/PermissionMatrixTable"
import { CreateRoleDialog } from "@/components/settings/CreateRoleDialog"
import { Shield, ShieldAlert } from "lucide-react"

export function RolesPermissionsPage() {
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedRoleId, setSelectedRoleId] = useState(null)
  const [createOpen, setCreateOpen] = useState(false)

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

  useEffect(() => {
    fetchRoles()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <SettingsPageHeader
          icon={Shield}
          title="Roles & Permissions"
          description="Define roles and their permissions across the organization"
          scope="org"
        />
        <CreateRoleDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          onSuccess={fetchRoles}
        />
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
          {roles.map((role) => (
            <SettingsCard
              key={role.id}
              className={`cursor-pointer transition-all duration-200 ${
                selectedRoleId === role.id
                  ? "ring-2 ring-primary border-primary/40"
                  : "hover:border-border/80"
              }`}
              onClick={() => setSelectedRoleId(selectedRoleId === role.id ? null : role.id)}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">{role.label || role.name}</h3>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {role.key}
                  </Badge>
                </div>
                {role.description && (
                  <p className="text-xs text-muted-foreground">{role.description}</p>
                )}
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px]">
                    {role.memberCount || role.membersCount || 0} members
                  </Badge>
                  {role.is_system && (
                    <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">
                      System
                    </Badge>
                  )}
                </div>
              </div>
            </SettingsCard>
          ))}
        </div>
      )}

      {selectedRoleId && (
        <SettingsCard title="Permissions" description="Toggle individual permissions for this role">
          <PermissionMatrixTable roleId={selectedRoleId} />
        </SettingsCard>
      )}
    </div>
  )
}
