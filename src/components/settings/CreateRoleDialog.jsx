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

const NO_CLONE = "__none__"

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
  const [cloneFromId, setCloneFromId] = useState(NO_CLONE)
  const [permissionKeys, setPermissionKeys] = useState(() => new Set())
  const [roles, setRoles] = useState([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    teamService.getRoles()
      .then((data) => setRoles(data.roles || []))
      .catch(() => toast.error("Failed to load roles"))
  }, [open])

  const reset = () => {
    setKey("")
    setLabel("")
    setDescription("")
    setCloneFromId(NO_CLONE)
    setPermissionKeys(new Set())
  }

  const handleLabelChange = (value) => {
    setLabel(value)
    if (cloneFromId === NO_CLONE) setKey(slugify(value))
  }

  const handleCloneChange = (value) => {
    setCloneFromId(value)
    if (value === NO_CLONE) {
      setKey(slugify(label))
      setPermissionKeys(new Set())
      return
    }
    const selected = roles.find((r) => r.id === value)
    if (selected) {
      const base = selected.key || selected.label || ""
      setKey(slugify(base) + "_copy")
      if (!label) setLabel(`${selected.label || selected.name} (copy)`)
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
      // Field names must match the controller: `permissionKeys` and `cloneFrom`.
      // The dialog previously sent neither, so every role was created empty.
      await teamService.createRole({
        key,
        label,
        description,
        permissionKeys: [...permissionKeys],
      })
      toast.success("Role created")
      onSuccess?.()
      onOpenChange?.(false)
      reset()
    } catch (err) {
      toast.error(err?.error || "Failed to create role")
    } finally {
      setSaving(false)
    }
  }

  const handleOpenChange = (next) => {
    if (!next) reset()
    onOpenChange?.(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Create Custom Role
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Custom Role</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
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
            <Label htmlFor="role-clone">Start from an existing role</Label>
            <Select value={cloneFromId} onValueChange={handleCloneChange}>
              <SelectTrigger id="role-clone">
                <SelectValue placeholder="Start empty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_CLONE}>Start empty</SelectItem>
                {roles.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.label || r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              Its permissions are pre-ticked below — adjust them before creating.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Permissions</Label>
            <div className="rounded-lg border border-border/50 p-4">
              <PermissionMatrixTable
                // Remounts on clone change so the picked role's permissions load in.
                key={cloneFromId}
                roleId={cloneFromId === NO_CLONE ? null : cloneFromId}
                value={permissionKeys}
                onChange={setPermissionKeys}
                hideSaveBar
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Creating..." : `Create Role (${permissionKeys.size})`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
