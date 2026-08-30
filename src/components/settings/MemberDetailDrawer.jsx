import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import {
  X,
  Trash2,
  Plus,
  Mail,
  Phone,
  Crown,
  ShieldCheck,
  CircleDot,
  Building2,
  Clock,
  CalendarDays,
  Lock,
  AlertTriangle,
} from "lucide-react"

function formatDate(value) {
  if (!value) return "—"
  try {
    return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
  } catch {
    return "—"
  }
}

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
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto bg-background">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader />
          </div>
        ) : member ? (
          <>
            <SheetHeader>
              <SheetTitle>Member Details</SheetTitle>
              <SheetDescription>Manage this teammate's role, status, and hall access.</SheetDescription>
            </SheetHeader>

            <div className="px-4 pb-6 space-y-4">
              {/* Profile card */}
              <Card className="py-5 gap-4">
                <CardContent className="px-5">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16 rounded-full border-2 border-primary/30 shadow-sm">
                      {member.avatar && <AvatarImage src={member.avatar} alt={member.name} />}
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-xl font-bold">
                        {member.name?.charAt(0)?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold truncate">{member.name}</h3>
                        {member.is_owner && (
                          <Badge className="gap-1 text-[10px] bg-primary/10 text-primary border-primary/30">
                            <Crown className="h-3 w-3" />
                            Owner
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{member.email}</span>
                      </div>
                      {member.phone && (
                        <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Phone className="h-3.5 w-3.5 shrink-0" />
                          <span>{member.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border/50 pt-4">
                    <div className="flex items-center gap-2 text-xs">
                      <CalendarDays className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <div>
                        <div className="text-muted-foreground">Joined</div>
                        <div className="font-medium">{formatDate(member.joined_at || member.created_at)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <div>
                        <div className="text-muted-foreground">Last login</div>
                        <div className="font-medium">{formatDate(member.last_login_at)}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {member.is_owner && (
                <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5 text-xs text-muted-foreground">
                  <Lock className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
                  Owners are locked: role, status, hall access, and removal can't be changed here. Transfer ownership first.
                </div>
              )}

              {/* Role & status card */}
              <Card className="py-5 gap-4">
                <CardHeader className="px-5">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    Role &amp; Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-5 space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Role</label>
                    <Select value={selectedRole} onValueChange={handleRoleChange} disabled={saving || member.is_owner}>
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
                    <label className="text-xs font-medium text-muted-foreground">Status</label>
                    <div className="flex gap-2">
                      <Button
                        variant={status === "active" ? "default" : "outline"}
                        size="sm"
                        className="flex-1 gap-1.5"
                        onClick={() => handleStatusChange("active")}
                        disabled={saving || member.is_owner}
                      >
                        <CircleDot className="h-3.5 w-3.5" />
                        Active
                      </Button>
                      <Button
                        variant={status === "suspended" ? "destructive" : "outline"}
                        size="sm"
                        className="flex-1 gap-1.5"
                        onClick={() => handleStatusChange("suspended")}
                        disabled={saving || member.is_owner}
                      >
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Suspended
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Hall access card */}
              <Card className="py-5 gap-4">
                <CardHeader className="px-5">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Building2 className="h-4 w-4 text-primary" />
                      Hall Access
                    </CardTitle>
                    {!member.is_owner && availableHalls.length > 0 && !addHallOpen && (
                      <Button variant="outline" size="sm" className="gap-1" onClick={() => setAddHallOpen(true)}>
                        <Plus className="h-3.5 w-3.5" />
                        Add Hall
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="px-5 space-y-3">
                  {addHallOpen && (
                    <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/30 p-3">
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
                      <p className="text-sm text-muted-foreground text-center py-4">No hall access assigned</p>
                    ) : (
                      memberHalls.map((mh) => (
                        <div
                          key={mh.hall_id}
                          className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 p-3"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0">
                              <Building2 className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="text-sm font-medium">{getHallName(mh)}</div>
                              <Badge variant="outline" className="mt-0.5 text-[10px]">
                                {mh.scope === "read_only" ? "Read Only" : "Full Access"}
                              </Badge>
                            </div>
                          </div>
                          {!member.is_owner && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={() => handleRemoveHall(mh.hall_id)}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Danger zone */}
              {member.is_owner ? (
                <div className="flex items-center justify-center gap-2 rounded-lg border border-border/50 bg-muted/30 px-3 py-2.5 text-sm text-muted-foreground">
                  <Lock className="h-3.5 w-3.5" />
                  Owners can't be removed from the organization
                </div>
              ) : (
                <Card className="py-5 gap-3 border-destructive/30 bg-destructive/[0.03]">
                  <CardHeader className="px-5">
                    <CardTitle className="flex items-center gap-2 text-sm text-destructive">
                      <AlertTriangle className="h-4 w-4" />
                      Danger Zone
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-5">
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
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
