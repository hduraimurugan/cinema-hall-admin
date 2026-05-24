import { useState, useEffect } from "react"
import {
  Building2, Plus, Pencil, Trash2, MapPin, Phone,
  CheckCircle2, XCircle, MoreHorizontal, RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { hallsAPI } from "../services/api"
import { useHall } from "../context/HallContext"

// ─── helpers ─────────────────────────────────────────────────────────────────
const EMPTY_FORM = {
  name: "", location: "", district: "", state: "",
  phone: "", description: "", latitude: "", longitude: "",
  is_active: true,
}

function FormField({ label, required, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
    </div>
  )
}

// ─── main page ────────────────────────────────────────────────────────────────
const HallsManagement = () => {
  const { halls, activeHall, setActiveHall, refetchHalls, hallsLoading } = useHall()

  const [loading, setLoading] = useState(hallsLoading)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [editTarget, setEditTarget] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => { setLoading(hallsLoading) }, [hallsLoading])

  const openCreate = () => {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  const openEdit = (hall) => {
    setEditTarget(hall)
    setForm({
      name: hall.name ?? "",
      location: hall.location ?? "",
      district: hall.district ?? "",
      state: hall.state ?? "",
      phone: hall.phone ?? "",
      description: hall.description ?? "",
      latitude: hall.latitude ?? "",
      longitude: hall.longitude ?? "",
      is_active: hall.is_active ?? true,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.location.trim() || !form.district.trim() || !form.state.trim()) {
      toast.error("Name, location, district, and state are required.")
      return
    }

    const payload = {
      name: form.name.trim(),
      location: form.location.trim(),
      district: form.district.trim(),
      state: form.state.trim(),
      phone: form.phone.trim() || null,
      description: form.description.trim() || null,
      latitude: form.latitude !== "" ? parseFloat(form.latitude) : null,
      longitude: form.longitude !== "" ? parseFloat(form.longitude) : null,
      is_active: form.is_active,
    }

    setSaving(true)
    try {
      if (editTarget) {
        await hallsAPI.updateHall(editTarget.id, payload)
        toast.success("Hall updated successfully.")
      } else {
        const { hall } = await hallsAPI.createHall(payload)
        setActiveHall(hall)
        toast.success(`Hall "${hall.name}" created and set as active.`)
      }
      await refetchHalls()
      setDialogOpen(false)
    } catch (err) {
      toast.error(err.message || "Failed to save hall.")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await hallsAPI.deleteHall(deleteTarget.id)
      toast.success(`Hall "${deleteTarget.name}" deleted.`)
      await refetchHalls()
      setDeleteTarget(null)
    } catch (err) {
      toast.error(err.message || "Failed to delete hall.")
    } finally {
      setDeleting(false)
    }
  }

  const handleToggleActive = async (hall) => {
    try {
      await hallsAPI.updateHall(hall.id, { is_active: !hall.is_active })
      toast.success(`Hall "${hall.name}" ${!hall.is_active ? "activated" : "deactivated"}.`)
      await refetchHalls()
    } catch (err) {
      toast.error(err.message || "Failed to update hall status.")
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Halls</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage your cinema halls — screens, shows, and bookings are scoped per hall
            </p>
          </div>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Hall
        </Button>
      </div>

      {/* Table card */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-6">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-md" />
              ))}
            </div>
          ) : halls.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <div className="p-4 rounded-full bg-muted">
                <Building2 className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold text-lg">No halls yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Create your first cinema hall to start managing screens and shows.
                </p>
              </div>
              <Button onClick={openCreate} className="gap-2 mt-2">
                <Plus className="h-4 w-4" />
                Create First Hall
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hall</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>District / State</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Active Hall</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {halls.map((hall) => {
                  const isSelected = activeHall?.id === hall.id
                  return (
                    <TableRow
                      key={hall.id}
                      className={isSelected ? "bg-primary/5 border-l-2 border-l-primary" : ""}
                    >
                      <TableCell>
                        <div className="font-medium">{hall.name}</div>
                        {hall.description && (
                          <div className="text-xs text-muted-foreground mt-0.5 max-w-[220px] truncate">
                            {hall.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          {hall.location}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {hall.district}{hall.district && hall.state ? ", " : ""}{hall.state}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {hall.phone ? (
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5" />{hall.phone}
                          </div>
                        ) : (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => handleToggleActive(hall)}
                          title={`Click to ${hall.is_active ? "deactivate" : "activate"}`}
                        >
                          {hall.is_active ? (
                            <Badge className="gap-1 bg-emerald-500/15 text-emerald-500 border border-emerald-500/25 hover:bg-emerald-500/25 cursor-pointer">
                              <CheckCircle2 className="h-3 w-3" />Active
                            </Badge>
                          ) : (
                            <Badge className="gap-1 bg-muted text-muted-foreground border hover:bg-muted/80 cursor-pointer">
                              <XCircle className="h-3 w-3" />Inactive
                            </Badge>
                          )}
                        </button>
                      </TableCell>
                      <TableCell>
                        {isSelected ? (
                          <Badge variant="secondary" className="gap-1 text-primary bg-primary/10">
                            <CheckCircle2 className="h-3 w-3" />Selected
                          </Badge>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setActiveHall(hall)}
                          >
                            Switch
                          </Button>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="gap-2 cursor-pointer"
                              onClick={() => openEdit(hall)}
                            >
                              <Pencil className="h-3.5 w-3.5" />Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                              onClick={() => setDeleteTarget(hall)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{editTarget ? "Edit Hall" : "Add New Hall"}</DialogTitle>
            <DialogDescription>
              {editTarget
                ? "Update the details for this cinema hall."
                : "Fill in the details to create a new cinema hall."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Hall Name" required>
                <Input
                  placeholder="e.g. PVR Cinemas"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </FormField>
              <FormField label="Phone">
                <Input
                  placeholder="e.g. 9876543210"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </FormField>
            </div>

            <FormField label="Location / Address" required>
              <Input
                placeholder="e.g. Mall Road, Anna Nagar"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="District" required>
                <Input
                  placeholder="e.g. Chennai"
                  value={form.district}
                  onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))}
                />
              </FormField>
              <FormField label="State" required>
                <Input
                  placeholder="e.g. Tamil Nadu"
                  value={form.state}
                  onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Latitude">
                <Input
                  type="number"
                  step="any"
                  placeholder="e.g. 13.0827"
                  value={form.latitude}
                  onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value }))}
                />
              </FormField>
              <FormField label="Longitude">
                <Input
                  type="number"
                  step="any"
                  placeholder="e.g. 80.2707"
                  value={form.longitude}
                  onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value }))}
                />
              </FormField>
            </div>

            <FormField label="Description">
              <Textarea
                placeholder="Optional short description…"
                rows={2}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </FormField>

            {editTarget && (
              <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Active</p>
                  <p className="text-xs text-muted-foreground">
                    Inactive halls are hidden from the hall switcher
                  </p>
                </div>
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(val) => setForm((f) => ({ ...f, is_active: val }))}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
              {editTarget ? "Save Changes" : "Create Hall"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the hall and{" "}
              <span className="font-semibold text-destructive">
                all screens, shows, and bookings
              </span>{" "}
              that belong to it. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90 gap-2"
            >
              {deleting && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
              Delete Hall
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default HallsManagement

