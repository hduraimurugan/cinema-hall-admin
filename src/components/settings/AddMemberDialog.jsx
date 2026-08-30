import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader } from "@/components/Loader"
import { toast } from "sonner"
import { teamService } from "@/services/settings/teamService"
import { useHall } from "@/context/HallContext"
import { UserPlus } from "lucide-react"

export function AddMemberDialog({ open, onOpenChange, onSuccess, roles }) {
  const { halls } = useHall()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [phone, setPhone] = useState("")
  const [roleId, setRoleId] = useState("")
  const [hallAssignments, setHallAssignments] = useState([])
  const [sending, setSending] = useState(false)
  const [rolesLoading, setRolesLoading] = useState(false)
  const [localRoles, setLocalRoles] = useState(roles || [])

  useEffect(() => {
    if (!roles || roles.length === 0) {
      setRolesLoading(true)
      teamService.getRoles()
        .then((data) => setLocalRoles(data.roles || []))
        .catch(() => toast.error("Failed to load roles"))
        .finally(() => setRolesLoading(false))
    }
  }, [roles])

  useEffect(() => {
    if (halls?.length) {
      setHallAssignments(halls.map((h) => ({ hallId: h.id, scope: "full" })))
    }
  }, [halls])

  useEffect(() => {
    if (!open) return
    setName("")
    setEmail("")
    setPassword("")
    setPhone("")
    setRoleId("")
  }, [open])

  const handleScopeChange = (hallId, scope) => {
    setHallAssignments((prev) =>
      prev.map((a) => (a.hallId === hallId ? { ...a, scope } : a))
    )
  }

  const handleHallToggle = (hallId, checked) => {
    if (checked) {
      setHallAssignments((prev) => [...prev, { hallId, scope: "full" }])
    } else {
      setHallAssignments((prev) => prev.filter((a) => a.hallId !== hallId))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name || !email || !password) {
      toast.error("Name, email, and password are required")
      return
    }
    setSending(true)
    try {
      await teamService.createMember({
        name,
        email,
        password,
        phone: phone || undefined,
        roleId: roleId || undefined,
        halls: hallAssignments.filter((a) => a.hallId).map((a) => ({ hallId: a.hallId, scope: a.scope })),
      })
      toast.success("Member created")
      onSuccess?.()
      onOpenChange?.(false)
    } catch (err) {
      toast.error(err?.error || "Failed to create member")
    } finally {
      setSending(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button size="sm" className="gap-2">
          <UserPlus className="h-4 w-4" />
          Add Member
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-0">
        <form onSubmit={handleSubmit} autoComplete="off" className="flex h-full flex-col">
          <SheetHeader>
            <SheetTitle>Add Team Member</SheetTitle>
            <SheetDescription>Create a new account and grant it access to your halls.</SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-5 px-4">
            {/* Hidden dummy fields to absorb Chrome's saved-login autofill */}
            <input type="text" name="fake-username" autoComplete="username" className="hidden" tabIndex={-1} aria-hidden="true" />
            <input type="password" name="fake-password" autoComplete="new-password" className="hidden" tabIndex={-1} aria-hidden="true" />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-name">Full Name</Label>
                <Input
                  id="add-name"
                  name="member_full_name"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="off"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-email">Email</Label>
                <Input
                  id="add-email"
                  name="member_email_address"
                  type="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="off"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-password">Password</Label>
                <Input
                  id="add-password"
                  name="member_new_password"
                  type="password"
                  placeholder="Set a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-phone">Phone</Label>
                <Input
                  id="add-phone"
                  name="member_phone_number"
                  type="tel"
                  placeholder="+1 234 567 890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-role">Role</Label>
              {rolesLoading ? (
                <Loader />
              ) : (
                <Select value={roleId} onValueChange={setRoleId}>
                  <SelectTrigger id="add-role">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {localRoles.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.label || r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {halls?.length > 0 && (
              <div className="space-y-3">
                <Label>Hall Access</Label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {halls.map((hall) => {
                    const assignment = hallAssignments.find((a) => a.hallId === hall.id)
                    return (
                      <div key={hall.id} className="flex items-center gap-3 rounded-lg border border-border/50 p-3">
                        <Checkbox
                          id={`add-hall-${hall.id}`}
                          checked={!!assignment}
                          onCheckedChange={(c) => handleHallToggle(hall.id, c)}
                        />
                        <Label htmlFor={`add-hall-${hall.id}`} className="flex-1 text-sm cursor-pointer">
                          {hall.name}
                        </Label>
                        {assignment && (
                          <Select
                            value={assignment.scope}
                            onValueChange={(v) => handleScopeChange(hall.id, v)}
                          >
                            <SelectTrigger className="h-8 w-28 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="full" className="text-xs">Full Access</SelectItem>
                              <SelectItem value="read_only" className="text-xs">Read Only</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <SheetFooter className="flex-row justify-end gap-3 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange?.(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={sending}>
              {sending ? "Creating..." : "Create Member"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
