import { useState, useEffect, useCallback } from "react"
import { useAuth } from "../context/AuthContext"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  User, Mail, Phone, Building, MapPin, Search, Navigation, Save,
} from "lucide-react"
import { toast } from "sonner"
import { State, City } from "country-state-city"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
})

function MapClickHandler({ onLocationPick }) {
  useMapEvents({
    click(e) { onLocationPick(e.latlng.lat, e.latlng.lng) },
  })
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
          const ll = e.target.getLatLng()
          onDrag(ll.lat, ll.lng)
        },
      }}
    />
  )
}

export const ProfilePage = () => {
  const { user, cinemaHall, updateHall } = useAuth()

  const [hallForm, setHallForm] = useState({
    hall_name: "", hall_location: "", hall_state: "", hall_district: "",
    latitude: null, longitude: null,
  })
  const [states, setStates] = useState([])
  const [cities, setCities] = useState([])
  const [markerPos, setMarkerPos] = useState(null)
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629])
  const [mapKey, setMapKey] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [hallError, setHallError] = useState("")

  useEffect(() => { setStates(State.getStatesOfCountry("IN")) }, [])

  useEffect(() => {
    if (cinemaHall) {
      setHallForm({
        hall_name: cinemaHall.name || "",
        hall_location: cinemaHall.location || "",
        hall_state: cinemaHall.state || "",
        hall_district: cinemaHall.district || "",
        latitude: cinemaHall.latitude || null,
        longitude: cinemaHall.longitude || null,
      })
      if (cinemaHall.latitude && cinemaHall.longitude) {
        const pos = [cinemaHall.latitude, cinemaHall.longitude]
        setMarkerPos(pos)
        setMapCenter(pos)
        setMapKey((k) => k + 1)
      }
    }
  }, [cinemaHall])

  useEffect(() => {
    if (hallForm.hall_state) {
      const selected = states.find((s) => s.name === hallForm.hall_state)
      if (selected) setCities(City.getCitiesOfState("IN", selected.isoCode))
    }
  }, [hallForm.hall_state, states])

  const handleLocationPick = useCallback((lat, lng) => {
    setMarkerPos([lat, lng])
    setHallForm((p) => ({ ...p, latitude: lat, longitude: lng }))
  }, [])

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setIsSearching(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`,
        { headers: { "Accept-Language": "en" } }
      )
      const data = await res.json()
      if (data.length > 0) {
        const lat = parseFloat(data[0].lat)
        const lng = parseFloat(data[0].lon)
        setMapCenter([lat, lng])
        setMapKey((k) => k + 1)
        handleLocationPick(lat, lng)
      } else {
        toast.error("Location not found.")
      }
    } catch {
      toast.error("Search failed.")
    } finally {
      setIsSearching(false)
    }
  }

  const handleHallSave = async () => {
    if (!hallForm.hall_name.trim()) { setHallError("Hall name is required."); return }
    if (!hallForm.hall_location.trim()) { setHallError("Address is required."); return }
    setHallError("")
    setIsSaving(true)
    const result = await updateHall(hallForm)
    setIsSaving(false)
    if (result.success) {
      toast.success("Cinema hall updated successfully.")
    } else {
      setHallError(result.message || "Failed to update.")
      toast.error(result.message || "Failed to update.")
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-8">

      {/* Admin Profile */}
      <section>
        <h2 className="text-xl font-semibold text-foreground mb-1">Admin Profile</h2>
        <p className="text-sm text-muted-foreground mb-5">Your account information</p>

        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{user?.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="text-foreground">{user?.email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="text-foreground">{user?.phone || "—"}</span>
            </div>
          </div>
        </div>
      </section>

      <Separator />

      {/* Cinema Hall Details */}
      <section>
        <h2 className="text-xl font-semibold text-foreground mb-1">Cinema Hall Details</h2>
        <p className="text-sm text-muted-foreground mb-5">Update your hall information and location</p>

        {hallError && (
          <Alert variant="destructive" className="mb-4 border-destructive/20 bg-destructive/5">
            <AlertDescription className="text-sm">{hallError}</AlertDescription>
          </Alert>
        )}

        <div className="bg-card border border-border rounded-xl p-5 space-y-5">
          {/* Hall Name */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Hall Name</Label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Grand Cinema Hall"
                className="pl-10 h-11"
                value={hallForm.hall_name}
                onChange={(e) => setHallForm((p) => ({ ...p, hall_name: e.target.value }))}
              />
            </div>
          </div>

          {/* Full Address */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Full Address</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="123 Main Street"
                className="pl-10 h-11"
                value={hallForm.hall_location}
                onChange={(e) => setHallForm((p) => ({ ...p, hall_location: e.target.value }))}
              />
            </div>
          </div>

          {/* State / District */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium">State</Label>
              <Select
                value={hallForm.hall_state}
                onValueChange={(v) => setHallForm((p) => ({ ...p, hall_state: v, hall_district: "" }))}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select State" />
                </SelectTrigger>
                <SelectContent>
                  {states.map((s) => (
                    <SelectItem key={s.isoCode} value={s.name}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">District</Label>
              <Select
                value={hallForm.hall_district}
                onValueChange={(v) => setHallForm((p) => ({ ...p, hall_district: v }))}
                disabled={!hallForm.hall_state}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select District" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((c) => (
                    <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Map Location */}
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium">Map Location</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Click the map or drag the pin to update coordinates
              </p>
            </div>

            {/* Search */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search location…"
                  className="pl-10 h-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <Button
                type="button" variant="outline" className="h-10 px-3"
                onClick={handleSearch} disabled={isSearching}
              >
                {isSearching ? (
                  <span className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>

            {/* Map */}
            <div className="rounded-xl overflow-hidden border border-border shadow-sm" style={{ height: 300 }}>
              <MapContainer
                key={mapKey}
                center={mapCenter}
                zoom={markerPos ? 14 : 5}
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

            {/* Coordinates */}
            {markerPos ? (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-primary/10 border border-primary/20 rounded-lg">
                <Navigation className="w-4 h-4 text-primary flex-shrink-0" />
                <p className="text-sm text-primary font-medium">
                  {markerPos[0].toFixed(6)}, {markerPos[1].toFixed(6)}
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center">No location set yet</p>
            )}
          </div>

          {/* Save Button */}
          <Button
            type="button"
            className="w-full h-11 font-medium"
            onClick={handleHallSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Saving…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                Save Changes
              </span>
            )}
          </Button>
        </div>
      </section>
    </div>
  )
}
