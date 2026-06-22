import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Loader } from "@/components/Loader"
import { toast } from "sonner"
import { teamService } from "@/services/settings/teamService"
import { useHall } from "@/context/HallContext"
import { X, Trash2, Plus } from "lucide-react"

export function MemberDetailDrawer({ memberId, open, onOpenChange, onSuccess, roles }) {
  const { halls } = useHall()
  const [member, setMember] = useState(null)
  const [memberHalls, setMemberHalls] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedRole, setSelectedRole] = useState("")
  const [status, setStatus] = useState("active")
  const [saving, setSaving] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [addHallOpen, setAddHallOpen] = useState(false)
  const [newHallId, setNewHallId] = useState("")
  const [newHallScope, setNewHallScope] = useState("full")
  const [localRoles, setLocalRoles] = useState(roles || [])
  const [rolesLoading, setRolesLoading] = useState(false)

  useEffect(() => {
    if (!memberId || !open) return
    setLoading(true)
    Promise.all([
      teamService.getMember(memberId),
      teamService.getMemberHalls(memberId),
      !roles || roles.length === 0 ? teamService.getRoles() : Promise.resolve({ roles }),
    ])
      .then(([memberData, hallsData, rolesData]) => {
        setMember(memberData.member || memberData)
        const h = hallsData.halls || hallsData.memberHalls || []
        setMemberHalls(h)
        setSelectedRole(memberData.member?.role_id || memberData.role_id || "")
        setStatus(memberData.member?.status || memberData.status || "active")
        if (rolesData?.roles) setLocalRoles(rolesData.roles)
      })
      .catch(() => toast.error("Failed to load member details"))
      .finally(() => setLoading(false))
  }, [memberId, open, roles])

  const handleRoleChange = async (newRoleId) => {
    setSelectedRole(newRoleId)
    setSaving(true)
    try {
      await teamService.updateMember(memberId, { roleId: newRoleId })
      toast.success("Role updated")
      onSuccess?.()
    } catch (err) {
      toast.error(err?.error || "Failed to update role")
      setSelectedRole(member?.role_id || "")
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (newStatus) => {
    setStatus(newStatus)
    setSaving(true)
    try {
      await teamService.updateMember(memberId, { status: newStatus })
      toast.success(newStatus === "active" ? "Member activated" : "Member suspended")
      onSuccess?.()
    } catch (err) {
      toast.error(err?.error || "Failed to update status")
      setStatus(member?.status || "active")
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveHall = async (hallId) => {
    try {
      await teamService.removeHallAssignment(memberId, hallId)
      setMemberHalls((prev) => prev.filter((h) => h.hall_id !== hallId))
      toast.success("Hall access removed")
      onSuccess?.()
    } catch (err) {
      toast.error(err?.error || "Failed to remove hall access")
    }
  }

  const handleAddHall = async () => {
    if (!newHallId) return
    try {
      await teamService.assignHalls(memberId, [{ hallId: newHallId, scope: newHallScope }])
      const updated = await teamService.getMemberHalls(memberId)
      setMemberHalls(updated.halls || updated.memberHalls || [])
      toast.success("Hall access added")
      setAddHallOpen(false)
      setNewHallId("")
      setNewHallScope("full")
      onSuccess?.()
    } catch (err) {
      toast.error(err?.error || "Failed to add hall access")
    }
  }

  const handleRemoveMember = async () => {
    setRemoving(true)
    try {
      await teamService.removeMember(memberId)
      toast.success("Member removed")
      onOpenChange?.(false)
      onSuccess?.()
    } catch (err) {
      toast.error(err?.error || "Failed to remove member")
    } finally {
      setRemoving(false)
    }
  }

  const availableHalls = halls?.filter(
    (h) => !memberHalls.some((mh) => mh.hall_id === h.id)
  ) || []

  const getHallName = (hallRef) => {
    const hall = halls?.find((h) => h.id === hallRef.hall_id)
    return hall?.name || hallRef.hall_name || hallRef.hall_id
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader />
          </div>
        ) : member ? (
          <>
            <SheetHeader className="mb-6">
              <SheetTitle>Member Details</SheetTitle>
            </SheetHeader>

            <div className="flex items-center gap-4 mb-6">
              <Avatar className="h-14 w-14 rounded-full border-2 border-primary/30">
                {member.avatar && <AvatarImage src={member.avatar} alt={member.name} />}
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-lg font-bold">
                  {member.name?.charAt(0)?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold">{member.name}</h3>
                <p className="text-sm text-muted-foreground">{member.email}</p>
              </div>
            </div>

            <Separator className="mb-6" />

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Role</label>
                <Select value={selectedRole} onValueChange={handleRoleChange} disabled={saving}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {localRoles.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.label || r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <div className="flex gap-2">
                  <Button
                    variant={status === "active" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleStatusChange("active")}
                    disabled={saving}
                  >
                    Active
                  </Button>
                  <Button
                    variant={status === "suspended" ? "destructive" : "outline"}
                    size="sm"
                    onClick={() => handleStatusChange("suspended")}
                    disabled={saving}
                  >
                    Suspended
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Hall Access</label>
                  {availableHalls.length > 0 && !addHallOpen && (
                    <Button variant="outline" size="sm" className="gap-1" onClick={() => setAddHallOpen(true)}>
                      <Plus className="h-3.5 w-3.5" />
                      Add Hall
                    </Button>
                  )}
                </div>

                {addHallOpen && (
                  <div className="flex items-center gap-2 rounded-lg border border-border/50 p-3">
                    <Select value={newHallId} onValueChange={setNewHallId}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select hall" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableHalls.map((h) => (
                          <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={newHallScope} onValueChange={setNewHallScope}>
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full">Full</SelectItem>
                        <SelectItem value="read_only">Read Only</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="sm" onClick={handleAddHall}>Add</Button>
                    <Button size="sm" variant="ghost" onClick={() => setAddHallOpen(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                <div className="space-y-2">
                  {memberHalls.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No hall access assigned</p>
                  ) : (
                    memberHalls.map((mh) => {
                      return (
                        <div key={mh.hall_id} className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{getHallName(mh)}</span>
                            <Badge variant="outline" className="text-[10px]">
                              {mh.scope === "read_only" ? "Read Only" : "Full Access"}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => handleRemoveHall(mh.hall_id)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              <Separator />

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full gap-2">
                    <Trash2 className="h-4 w-4" />
                    Remove from Organization
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove member?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently remove {member.name} from your organization. Their access to all halls will be revoked. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRemoveMember} disabled={removing}>
                      {removing ? "Removing..." : "Remove"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
