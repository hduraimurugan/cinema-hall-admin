import { useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useHall } from "../context/HallContext"
import { hallsAPI } from "../services/api"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Film, Building2, MapPin, Search, Navigation, CheckCircle2,
  ArrowRight, Sparkles, ChevronLeft, LogOut,
} from "lucide-react"
import { State, City } from "country-state-city"
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { toast } from "sonner"

// Fix Leaflet default icons broken by bundlers
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
})

function MapClickHandler({ onPick }) {
  useMapEvents({ click(e) { onPick(e.latlng.lat, e.latlng.lng) } })
  return null
}

function DraggableMarker({ position, onDrag }) {
  if (!position) return null
  return (
    <Marker
      position={position}
      draggable
      eventHandlers={{ dragend(e) { const ll = e.target.getLatLng(); onDrag(ll.lat, ll.lng) } }}
    />
  )
}

const IN_STATES = State.getStatesOfCountry("IN")

export default function OnboardingPage() {
  const { user, logout } = useAuth()
  const { refetchHalls } = useHall()
  const navigate = useNavigate()

  // Step: 1 = hall info, 2 = location, 3 = success
  const [step, setStep] = useState(1)

  // Step 1 form
  const [form, setForm] = useState({ name: "", location: "", state: "", district: "" })
  const [cities, setCities] = useState([])
  const [error, setError] = useState("")

  // Step 2 map
  const [markerPos, setMarkerPos] = useState(null)
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629])
  const [mapKey, setMapKey] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)

  // Submit
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleStateChange = (value) => {
    const selected = IN_STATES.find((s) => s.name === value)
    setCities(selected ? City.getCitiesOfState("IN", selected.isoCode) : [])
    setForm((p) => ({ ...p, state: value, district: "" }))
  }

  const handleStep1Next = () => {
    if (!form.name.trim()) return setError("Hall name is required.")
    if (!form.location.trim()) return setError("Address is required.")
    if (!form.state) return setError("Please select a state.")
    setError("")
    setStep(2)
  }

  const handleLocationPick = useCallback((lat, lng) => {
    setMarkerPos([lat, lng])
    setMapCenter([lat, lng])
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

  const handleFinish = async (skipLocation = false) => {
    setIsSubmitting(true)
    try {
      await hallsAPI.createHall({
        name: form.name.trim(),
        location: form.location.trim(),
        district: form.district || null,
        state: form.state,
        latitude: skipLocation ? null : (markerPos?.[0] ?? null),
        longitude: skipLocation ? null : (markerPos?.[1] ?? null),
      })
      setStep(3)
      // After brief success display, refresh halls and navigate home
      setTimeout(async () => {
        await refetchHalls()
        navigate("/", { replace: true })
      }, 2200)
    } catch (err) {
      toast.error(err.message || "Failed to create hall. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const firstName = user?.name?.split(" ")[0] ?? "there"

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-950 via-[#180404] to-[#1a0a0a] px-4 py-10"
      style={{
        backgroundImage: "radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }}
    >
      {/* Ambient blobs */}
      <div className="absolute top-1/4 -left-40 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-40 w-[400px] h-[400px] bg-rose-900/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      {/* Giant bg film icon */}
      <Film
        className="absolute inset-0 m-auto w-[42rem] h-[42rem] text-white/[0.015] pointer-events-none"
        strokeWidth={0.3}
      />

      {/* ───── Success overlay ───── */}
      {step === 3 && (
        <div className="relative z-20 flex flex-col items-center gap-6 text-center animate-in fade-in zoom-in-95 duration-500">
          <div className="w-24 h-24 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shadow-[0_0_60px_rgba(16,185,129,0.3)]">
            <CheckCircle2 className="w-12 h-12 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Hall Created!</h2>
            <p className="text-slate-400">Taking you to your dashboard…</p>
          </div>
          <div className="w-48 h-1 rounded-full bg-slate-800 overflow-hidden">
            <div className="h-full bg-emerald-400 rounded-full animate-[width_2s_ease-in-out_forwards]"
              style={{ animation: "grow 2.1s ease-out forwards" }} />
          </div>
          <style>{`@keyframes grow { from { width:0% } to { width:100% } }`}</style>
        </div>
      )}

      {/* ───── Main card ───── */}
      {step !== 3 && (
        <div className="relative z-10 w-full max-w-lg">

          {/* Back / Logout */}
          <div className="flex justify-start mb-6">
            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </button>
          </div>

          {/* Logo */}
          <div className="flex items-center justify-center gap-2.5 mb-8">
            <div className="w-10 h-10 bg-primary/20 border border-primary/30 rounded-xl flex items-center justify-center">
              <Film className="w-5 h-5 text-primary" />
            </div>
            <span className="text-white font-bold text-lg tracking-wide">CineMax Admin</span>
          </div>

          {/* Hero heading */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-4">
              <Sparkles className="w-3 h-3" />
              First-time setup
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome, {firstName}!
            </h1>
            <p className="text-slate-400 text-sm">
              Let's set up your first cinema hall. You'll be on the dashboard in under a minute.
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-3 mb-8">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-3">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-semibold transition-all duration-300 ${
                  step === s
                    ? "border-primary bg-primary text-white shadow-[0_0_16px_rgba(var(--primary-rgb),0.4)]"
                    : step > s
                    ? "border-emerald-500 bg-emerald-500/20 text-emerald-400"
                    : "border-slate-700 bg-transparent text-slate-500"
                }`}>
                  {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
                </div>
                <span className={`text-xs font-medium ${step === s ? "text-white" : "text-slate-500"}`}>
                  {s === 1 ? "Hall Details" : "Location"}
                </span>
                {s < 2 && <div className={`w-12 h-px ${step > 1 ? "bg-emerald-500/60" : "bg-slate-700"}`} />}
              </div>
            ))}
          </div>

          {/* Card */}
          <div className="bg-slate-900/70 backdrop-blur-md border border-white/[0.07] rounded-2xl px-6 py-7 shadow-2xl">

            {/* ── Step 1: Hall Info ── */}
            {step === 1 && (
              <div className="space-y-5">
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="w-4 h-4 text-primary" />
                  <h2 className="text-base font-semibold text-white">Hall Information</h2>
                </div>

                {error && (
                  <Alert variant="destructive" className="border-destructive/20 bg-destructive/5">
                    <AlertDescription className="text-sm">{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label className="text-slate-300 text-sm font-medium">Hall Name</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                      placeholder="e.g. Grand Cineplex"
                      className="pl-10 h-11 bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-primary"
                      value={form.name}
                      onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300 text-sm font-medium">Full Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                      placeholder="e.g. 42 Anna Salai, Chennai"
                      className="pl-10 h-11 bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-primary"
                      value={form.location}
                      onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-slate-300 text-sm font-medium">State</Label>
                    <Select value={form.state} onValueChange={handleStateChange}>
                      <SelectTrigger className="h-11 bg-slate-800/60 border-slate-700 text-white focus:border-primary">
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {IN_STATES.map((s) => (
                          <SelectItem key={s.isoCode} value={s.name}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300 text-sm font-medium">District</Label>
                    <Select
                      value={form.district}
                      onValueChange={(v) => setForm((p) => ({ ...p, district: v }))}
                      disabled={!form.state}
                    >
                      <SelectTrigger className="h-11 bg-slate-800/60 border-slate-700 text-white focus:border-primary disabled:opacity-50">
                        <SelectValue placeholder="Select district" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {cities.map((c) => (
                          <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  className="w-full h-11 font-semibold mt-2"
                  onClick={handleStep1Next}
                >
                  Next — Set Location
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}

            {/* ── Step 2: Location ── */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="w-4 h-4 text-primary" />
                  <h2 className="text-base font-semibold text-white">Pin Your Location</h2>
                  <span className="ml-auto text-xs text-slate-500 font-medium">Optional</span>
                </div>
                <p className="text-xs text-slate-400">
                  Helps customers find your hall on the map. You can skip this and add it later.
                </p>

                {/* Search */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                      placeholder="Search location…"
                      className="pl-10 h-10 bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-primary"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    />
                  </div>
                  <Button
                    type="button" variant="outline"
                    className="h-10 px-3 border-slate-700"
                    onClick={handleSearch} disabled={isSearching}
                  >
                    {isSearching
                      ? <span className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
                      : <Search className="w-4 h-4" />}
                  </Button>
                </div>

                {/* Map */}
                <div className="rounded-xl overflow-hidden border border-white/[0.08] shadow-lg" style={{ height: 260 }}>
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
                    <MapClickHandler onPick={handleLocationPick} />
                    <DraggableMarker position={markerPos} onDrag={handleLocationPick} />
                  </MapContainer>
                </div>

                {/* Coordinates badge */}
                {markerPos ? (
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-primary/10 border border-primary/20 rounded-lg">
                    <Navigation className="w-4 h-4 text-primary flex-shrink-0" />
                    <p className="text-sm text-primary font-medium">
                      {markerPos[0].toFixed(5)}, {markerPos[1].toFixed(5)}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 text-center">
                    Click on the map or drag the pin to set coordinates
                  </p>
                )}

                {/* Action buttons */}
                <div className="flex gap-3 pt-1">
                  <Button
                    type="button" variant="ghost"
                    className="flex-1 h-11 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500"
                    onClick={() => setStep(1)}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back
                  </Button>
                  <Button
                    type="button" variant="outline"
                    className="flex-1 h-11 border-slate-600 text-slate-300 hover:text-white"
                    onClick={() => handleFinish(true)}
                    disabled={isSubmitting}
                  >
                    Skip for now
                  </Button>
                  <Button
                    className="flex-1 h-11 font-semibold"
                    onClick={() => handleFinish(false)}
                    disabled={isSubmitting || !markerPos}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Creating…
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Finish Setup
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <p className="text-center text-xs text-slate-600 mt-5">
            You can add more halls anytime from{" "}
            <span className="text-slate-400">My Halls</span> in the sidebar.
          </p>
        </div>
      )}
    </div>
  )
}

export function OnboardingPageSkeleton() {
  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-950 via-[#180404] to-[#1a0a0a] px-4 py-10"
      style={{
        backgroundImage: "radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }}
    >
      {/* Ambient blobs */}
      <div className="absolute top-1/4 -left-40 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-40 w-[400px] h-[400px] bg-rose-900/15 rounded-full blur-3xl pointer-events-none" />
      <Film
        className="absolute inset-0 m-auto w-[42rem] h-[42rem] text-white/[0.015] pointer-events-none"
        strokeWidth={0.3}
      />

      <div className="relative z-10 w-full max-w-lg">
        {/* Sign-out placeholder */}
        <div className="flex justify-start mb-6">
          <Skeleton className="h-4 w-20 bg-slate-800" />
        </div>

        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <Skeleton className="w-10 h-10 rounded-xl bg-slate-800" />
          <Skeleton className="h-5 w-36 bg-slate-800" />
        </div>

        {/* Hero heading */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <Skeleton className="h-6 w-32 rounded-full bg-slate-800" />
          <Skeleton className="h-9 w-64 bg-slate-800" />
          <Skeleton className="h-4 w-80 bg-slate-800/60" />
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <Skeleton className="w-8 h-8 rounded-full bg-primary/30" />
          <Skeleton className="h-4 w-20 bg-slate-800" />
          <Skeleton className="h-px w-12 bg-slate-800" />
          <Skeleton className="w-8 h-8 rounded-full bg-slate-800" />
          <Skeleton className="h-4 w-16 bg-slate-800" />
        </div>

        {/* Card */}
        <div className="bg-slate-900/70 backdrop-blur-md border border-white/[0.07] rounded-2xl px-6 py-7 shadow-2xl space-y-5">
          {/* Section title */}
          <div className="flex items-center gap-2">
            <Skeleton className="w-4 h-4 rounded bg-slate-700" />
            <Skeleton className="h-5 w-40 bg-slate-700" />
          </div>
          {/* Hall name */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-20 bg-slate-700" />
            <Skeleton className="h-11 w-full rounded-md bg-slate-800" />
          </div>
          {/* Address */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-24 bg-slate-700" />
            <Skeleton className="h-11 w-full rounded-md bg-slate-800" />
          </div>
          {/* State / District */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Skeleton className="h-4 w-10 bg-slate-700" />
              <Skeleton className="h-11 w-full rounded-md bg-slate-800" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16 bg-slate-700" />
              <Skeleton className="h-11 w-full rounded-md bg-slate-800" />
            </div>
          </div>
          {/* Button */}
          <Skeleton className="h-11 w-full rounded-md bg-primary/20" />
        </div>
      </div>
    </div>
  )
}
