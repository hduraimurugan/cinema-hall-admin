import { useState, useEffect, useCallback } from "react"
import {
  Building2, Plus, Pencil, Trash2, MapPin, Phone,
  CheckCircle2, XCircle, MoreHorizontal, RefreshCw,
  Search, Navigation,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  Sheet, SheetContent, SheetHeader, SheetTitle,
  SheetDescription, SheetFooter,
} from "@/components/ui/sheet"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import { State, City } from "country-state-city"
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { hallsAPI } from "../services/api"
import { useHall } from "../context/HallContext"

// Fix Leaflet default icon paths broken by bundlers
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
})

// ─── Map helpers ──────────────────────────────────────────────────────────────
function MapClickHandler({ onLocationPick }) {
  useMapEvents({ click(e) { onLocationPick(e.latlng.lat, e.latlng.lng) } })
  return null
}

function DraggableMarker({ position, onDrag }) {
  if (!position) return null
  return (
    <Marker
      position={position}
      draggable
      eventHandlers={{
        dragend(e) {
          const { lat, lng } = e.target.getLatLng()
          onDrag(lat, lng)
        },
      }}
    />
  )
}

// ─── helpers ─────────────────────────────────────────────────────────────────
const EMPTY_FORM = {
  name: "", location: "", district: "", state: "",
  phone: "", description: "", latitude: null, longitude: null,
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
  const [sheetOpen, setSheetOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [editTarget, setEditTarget] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // State / city dropdowns
  const [allStates] = useState(() => State.getStatesOfCountry("IN"))
  const [cities, setCities] = useState([])

  // Map state
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629])
  const [markerPos, setMarkerPos] = useState(null)
  const [mapSearch, setMapSearch] = useState("")
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => { setLoading(hallsLoading) }, [hallsLoading])

  // Reload city list when state changes
  useEffect(() => {
    if (form.state) {
      const selected = allStates.find(s => s.name === form.state)
      setCities(selected ? City.getCitiesOfState("IN", selected.isoCode) : [])
    } else {
      setCities([])
    }
  }, [form.state, allStates])

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleLocationPick = useCallback((lat, lng) => {
    setMarkerPos([lat, lng])
    setForm(f => ({ ...f, latitude: lat, longitude: lng }))
  }, [])

  const handleMapSearch = async () => {
    if (!mapSearch.trim()) return
    setIsSearching(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(mapSearch)}&format=json&limit=1`,
        { headers: { "Accept-Language": "en" } }
      )
      const data = await res.json()
      if (data.length > 0) {
        const numLat = parseFloat(data[0].lat)
        const numLon = parseFloat(data[0].lon)
        setMapCenter([numLat, numLon])
        handleLocationPick(numLat, numLon)
      } else {
        toast.error("Location not found. Try a different search.")
      }
    } catch {
      toast.error("Map search failed. Please try again.")
    } finally {
      setIsSearching(false)
    }
  }

  const openCreate = () => {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setMarkerPos(null)
    setMapCenter([20.5937, 78.9629])
    setMapSearch("")
    setSheetOpen(true)
  }

  const openEdit = (hall) => {
    setEditTarget(hall)
    const lat = hall.latitude != null ? parseFloat(hall.latitude) : null
    const lng = hall.longitude != null ? parseFloat(hall.longitude) : null
    setForm({
      name: hall.name ?? "",
      location: hall.location ?? "",
      district: hall.district ?? "",
      state: hall.state ?? "",
      phone: hall.phone ?? "",
      description: hall.description ?? "",
      latitude: lat,
      longitude: lng,
      is_active: hall.is_active ?? true,
    })
    if (lat && lng) { setMarkerPos([lat, lng]); setMapCenter([lat, lng]) }
    else { setMarkerPos(null); setMapCenter([20.5937, 78.9629]) }
    setMapSearch("")
    setSheetOpen(true)
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
      latitude: form.latitude ?? null,
      longitude: form.longitude ?? null,
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
      setSheetOpen(false)
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Halls</h1>
            <p className="text-sm text-muted-foreground">
              Manage your cinema halls — screens, shows, and bookings are scoped per hall
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {halls.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-primary inline-block" />
              {halls.length} hall{halls.length !== 1 ? "s" : ""}
            </div>
          )}
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Hall
          </Button>
        </div>
      </div>

      {/* Table card */}
      <Card className="border-border/60">
        <CardHeader className="pb-0 pt-4 px-5">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">All Halls</CardTitle>
            {!loading && halls.length > 0 && (
              <span className="text-xs text-muted-foreground">
                Showing {halls.length} hall{halls.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-3 px-5">
          {loading ? (
            <div className="space-y-3">
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
                <TableRow className="hover:bg-transparent border-border/50">
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Hall</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Location</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">District / State</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Phone</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Active Hall</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {halls.map((hall) => {
                  const isSelected = activeHall?.id === hall.id
                  return (
                    <TableRow
                      key={hall.id}
                      className={`border-border/40 ${isSelected ? "bg-primary/5 border-l-2 border-l-primary" : "hover:bg-muted/30"}`}
                    >
                      <TableCell>
                        <div className="font-medium text-sm">{hall.name}</div>
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
                      <TableCell className="text-sm text-muted-foreground">
                        {hall.district}{hall.district && hall.state ? ", " : ""}{hall.state}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {hall.phone ? (
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5" />{hall.phone}
                          </div>
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
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
                              onClick={() => setTimeout(() => openEdit(hall), 0)}
                            >
                              <Pencil className="h-3.5 w-3.5" />Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                              onClick={() => setTimeout(() => setDeleteTarget(hall), 0)}
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

      {/* Side Sheet — Create / Edit */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-[520px] p-0 flex flex-col">
          <SheetHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
            <SheetTitle>{editTarget ? "Edit Hall" : "Add New Hall"}</SheetTitle>
            <SheetDescription>
              {editTarget
                ? "Update the details for this cinema hall."
                : "Fill in the details to create a new cinema hall."}
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="flex-1">
            <div className="px-6 py-5 space-y-5">
              {/* Name + Phone */}
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Hall Name" required>
                  <Input
                    placeholder="e.g. PVR Cinemas"
                    value={form.name}
                    onChange={(e) => setField("name", e.target.value)}
                  />
                </FormField>
                <FormField label="Phone">
                  <Input
                    placeholder="e.g. 9876543210"
                    value={form.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                  />
                </FormField>
              </div>

              {/* Address */}
              <FormField label="Location / Address" required>
                <Input
                  placeholder="e.g. Mall Road, Anna Nagar"
                  value={form.location}
                  onChange={(e) => setField("location", e.target.value)}
                />
              </FormField>

              {/* State + District dropdowns */}
              <div className="grid grid-cols-2 gap-3">
                <FormField label="State" required>
                  <Select
                    value={form.state}
                    onValueChange={(val) => { setField("state", val); setField("district", "") }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent className="max-h-56">
                      {allStates.map(s => (
                        <SelectItem key={s.isoCode} value={s.name}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField label="District" required>
                  <Select
                    value={form.district}
                    onValueChange={(val) => setField("district", val)}
                    disabled={!form.state || cities.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={!form.state ? "Select state first" : "Select district"} />
                    </SelectTrigger>
                    <SelectContent className="max-h-56">
                      {cities.map(c => (
                        <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              </div>

              {/* Description */}
              <FormField label="Description">
                <Textarea
                  placeholder="Optional short description…"
                  rows={2}
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                />
              </FormField>

              {/* Active toggle — edit only */}
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
                    onCheckedChange={(val) => setField("is_active", val)}
                  />
                </div>
              )}

              {/* Map Picker */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  Pin Location on Map
                  {form.latitude != null && form.longitude != null && (
                    <span className="text-xs text-muted-foreground font-normal">
                      {Number(form.latitude).toFixed(5)}, {Number(form.longitude).toFixed(5)}
                    </span>
                  )}
                </Label>

                {/* Map search bar */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      className="pl-8 h-9 text-sm"
                      placeholder="Search location…"
                      value={mapSearch}
                      onChange={(e) => setMapSearch(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleMapSearch()}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 gap-1.5"
                    onClick={handleMapSearch}
                    disabled={isSearching}
                  >
                    {isSearching
                      ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      : <Navigation className="h-3.5 w-3.5" />
                    }
                    Go
                  </Button>
                </div>

                {/* Leaflet map */}
                <div className="rounded-lg overflow-hidden border border-border h-64">
                  <MapContainer
                    center={mapCenter}
                    zoom={markerPos ? 14 : 5}
                    key={`${mapCenter[0]}-${mapCenter[1]}`}
                    style={{ height: "100%", width: "100%" }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapClickHandler onLocationPick={handleLocationPick} />
                    <DraggableMarker position={markerPos} onDrag={handleLocationPick} />
                  </MapContainer>
                </div>
                <p className="text-xs text-muted-foreground">
                  Click the map or drag the pin to set your cinema hall's exact location.
                </p>
              </div>
            </div>
          </ScrollArea>

          <SheetFooter className="px-6 py-4 border-t flex-shrink-0 gap-2">
            <Button variant="outline" onClick={() => setSheetOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
              {editTarget ? "Save Changes" : "Create Hall"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

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
