import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { teamService } from "@/services/settings/teamService"
import { PermissionMatrixTable } from "./PermissionMatrixTable"
import { Plus } from "lucide-react"

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
}

export function CreateRoleDialog({ open, onOpenChange, onSuccess }) {
  const [key, setKey] = useState("")
  const [label, setLabel] = useState("")
  const [description, setDescription] = useState("")
  const [cloneFromId, setCloneFromId] = useState("")
  const [cloneRoleId, setCloneRoleId] = useState(null)
  const [roles, setRoles] = useState([])
  const [saving, setSaving] = useState(false)
  const [loadingRoles, setLoadingRoles] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoadingRoles(true)
    teamService.getRoles()
      .then((data) => setRoles(data.roles || []))
      .catch(() => toast.error("Failed to load roles"))
      .finally(() => setLoadingRoles(false))
  }, [open])

  const handleLabelChange = (value) => {
    setLabel(value)
    if (!cloneFromId) setKey(slugify(value))
  }

  const handleCloneChange = (value) => {
    setCloneFromId(value)
    if (value) {
      const selected = roles.find((r) => r.id === value)
      if (selected) {
        setLabel(selected.label || selected.name || "")
        setKey(selected.key ? slugify(selected.key) + "_clone" : slugify(selected.label || selected.name || "") + "_clone")
        setCloneRoleId(value)
      }
    } else {
      setCloneRoleId(null)
      setKey(slugify(label))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!key || !label) {
      toast.error("Key and label are required")
      return
    }
    setSaving(true)
    try {
      await teamService.createRole({ key, label, description, cloneFromId: cloneFromId || undefined })
      toast.success("Role created")
      onSuccess?.()
      onOpenChange?.(false)
      setKey("")
      setLabel("")
      setDescription("")
      setCloneFromId("")
      setCloneRoleId(null)
    } catch (err) {
      toast.error(err?.error || "Failed to create role")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Create Custom Role
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Custom Role</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role-key">Key</Label>
              <Input
                id="role-key"
                placeholder="custom_role"
                value={key}
                onChange={(e) => setKey(slugify(e.target.value))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-label">Label</Label>
              <Input
                id="role-label"
                placeholder="Custom Role"
                value={label}
                onChange={(e) => handleLabelChange(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role-desc">Description</Label>
            <Textarea
              id="role-desc"
              placeholder="Describe what this role can do..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role-clone">Clone from existing</Label>
            <Select value={cloneFromId} onValueChange={handleCloneChange}>
              <SelectTrigger id="role-clone">
                <SelectValue placeholder="Don't clone (start empty)" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.label || r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {cloneRoleId && (
            <div className="rounded-lg border border-border/50 p-4">
              <PermissionMatrixTable roleId={cloneRoleId} />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange?.(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Creating..." : "Create Role"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
