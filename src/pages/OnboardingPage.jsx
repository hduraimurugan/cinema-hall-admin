import { useState, useCallback, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useHall } from "../context/HallContext"
import { authAPI } from "../services/api"
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
  ArrowRight, Sparkles, ChevronLeft, LogOut, Briefcase
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
  const { user, logout, refreshUser } = useAuth()
  const { refetchHalls } = useHall()
  const navigate = useNavigate()

  // Step: 1 = Org details, 2 = hall info, 3 = location, 4 = success
  const [step, setStep] = useState(1)

  // Step 1
  const [orgName, setOrgName] = useState("")

  // Step 2
  const [form, setForm] = useState({ name: "", location: "", state: "", district: "" })
  const [cities, setCities] = useState([])
  const [error, setError] = useState("")

  // Step 3 map
  const [markerPos, setMarkerPos] = useState(null)
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629])
  const [mapKey, setMapKey] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)

  // Submit
  const [isSubmitting, setIsSubmitting] = useState(false)

  // An already-onboarded admin must never reach this flow: completeOnboarding
  // reuses the existing organization but creates a NEW hall every time it runs.
  useEffect(() => {
    if (user?.orgId && step !== 4) {
      navigate("/", { replace: true })
    }
  }, [user?.orgId, step, navigate])

  const handleStateChange = (value) => {
    const selected = IN_STATES.find((s) => s.name === value)
    setCities(selected ? City.getCitiesOfState("IN", selected.isoCode) : [])
    setForm((p) => ({ ...p, state: value, district: "" }))
  }

  const handleStep1Next = () => {
    if (!orgName.trim()) return setError("Organization name is required.")
    setError("")
    setStep(2)
  }

  const handleStep2Next = () => {
    if (!form.name.trim()) return setError("Hall name is required.")
    if (!form.location.trim()) return setError("Address is required.")
    if (!form.state) return setError("Please select a state.")
    setError("")
    setStep(3)
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
      const result = await authAPI.completeOnboarding({
        orgName: orgName.trim(),
        name: form.name.trim(),
        location: form.location.trim(),
        district: form.district || null,
        state: form.state,
        latitude: skipLocation ? null : (markerPos?.[0] ?? null),
        longitude: skipLocation ? null : (markerPos?.[1] ?? null),
      })
      
      setStep(4)
      
      // Update auth context state with newly returned user details (orgId, etc.)
      if (refreshUser) {
        await refreshUser();
      }

      setTimeout(async () => {
        await refetchHalls()
        navigate("/", { replace: true })
      }, 2200)
    } catch (err) {
      toast.error(err.message || "Failed to complete onboarding. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const firstName = user?.name?.split(" ")[0] ?? "there"

  return (
    <>
      {/* Fixed decorative background */}
      <div
        className="fixed inset-0 bg-gradient-to-br from-slate-950 via-[#180404] to-[#1a0a0a] -z-10"
        style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)", backgroundSize: "28px 28px" }}
      />
      <div className="fixed top-1/4 -left-40 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-1/4 -right-40 w-[400px] h-[400px] bg-rose-900/15 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-primary/5 rounded-full blur-3xl pointer-events-none -z-10" />
      <Film className="fixed inset-0 m-auto w-[42rem] h-[42rem] text-white/[0.015] pointer-events-none -z-10" strokeWidth={0.3} />

      {/* Fixed Sign out button */}
      {step !== 4 && (
        <div className="fixed top-4 left-4 z-50">
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      )}

      {/* Scrollable page */}
      <div className="h-full overflow-y-auto">
      <div className="min-h-full flex items-center justify-center px-4 py-10">

      {/* ───── Success overlay ───── */}
      {step === 4 && (
        <div className="relative z-20 flex flex-col items-center gap-6 text-center animate-in fade-in zoom-in-95 duration-500">
          <div className="w-24 h-24 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shadow-[0_0_60px_rgba(16,185,129,0.3)]">
            <CheckCircle2 className="w-12 h-12 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Onboarding Completed!</h2>
            <p className="text-slate-400">Taking you to your dashboard…</p>
          </div>
          <div className="w-48 h-1 rounded-full bg-slate-800 overflow-hidden">
            <div className="h-full bg-emerald-400 rounded-full"
              style={{ animation: "grow 2.1s ease-out forwards" }} />
          </div>
          <style>{`@keyframes grow { from { width:0% } to { width:100% } }`}</style>
        </div>
      )}

      {/* ───── Main card ───── */}
      {step !== 4 && (
        <div className="w-full max-w-lg">

          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-7">
            <div className="w-11 h-11 bg-primary/20 border border-primary/40 rounded-xl flex items-center justify-center shadow-[0_0_24px_rgba(var(--primary-rgb),0.25)]">
              <Film className="w-5 h-5 text-primary" />
            </div>
            <span className="text-white font-bold text-xl tracking-wide">CineMax Admin</span>
          </div>

          {/* Hero heading */}
          <div className="text-center mb-7">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-semibold mb-4 shadow-[0_0_16px_rgba(var(--primary-rgb),0.15)]">
              <Sparkles className="w-3 h-3" />
              First-time setup
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
              Welcome, {firstName}!
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              Let's set up your organization and first cinema hall to get started.
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center mb-7">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div className="flex items-center gap-2.5">
                  <div className={`flex items-center justify-center w-9 h-9 rounded-full border-2 text-sm font-bold transition-all duration-300 ${
                    step === s
                      ? "border-primary bg-primary text-white shadow-[0_0_20px_rgba(var(--primary-rgb),0.45)]"
                      : step > s
                      ? "border-emerald-500 bg-emerald-500/15 text-emerald-400"
                      : "border-slate-700 bg-slate-900/50 text-slate-500"
                  }`}>
                    {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
                  </div>
                  <span className={`text-sm font-medium transition-colors ${step === s ? "text-white" : "text-slate-500"}`}>
                    {s === 1 ? "Organization" : s === 2 ? "Hall Details" : "Location"}
                  </span>
                </div>
                {s < 3 && (
                  <div className="mx-4 w-14 h-px relative">
                    <div className="absolute inset-0 bg-slate-700 rounded-full" />
                    <div className={`absolute inset-0 bg-emerald-500/60 rounded-full transition-all duration-500 ${step > s ? "w-full" : "w-0"}`} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Card */}
          <div className="relative bg-slate-900/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.6)] overflow-hidden">
            {/* Accent top bar */}
            <div className="h-[3px] w-full bg-gradient-to-r from-transparent via-primary to-transparent opacity-80" />

            {/* ── Step 1: Organization details ── */}
            {step === 1 && (
              <div className="px-7 py-7 space-y-5">
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center">
                    <Briefcase className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <h2 className="text-base font-semibold text-white">Create Your Organization</h2>
                </div>

                {error && (
                  <Alert variant="destructive" className="border-destructive/30 bg-destructive/8">
                    <AlertDescription className="text-sm">{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-1.5">
                  <Label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Organization Name</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                      placeholder="e.g. Cineplex Entertainment"
                      className="pl-10 h-11 bg-slate-800/50 border-slate-700/80 text-white placeholder:text-slate-600 focus:border-primary/70 focus:bg-slate-800 transition-colors"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                    />
                  </div>
                </div>

                <Button
                  className="w-full h-11 font-semibold mt-2 shadow-[0_4px_20px_rgba(var(--primary-rgb),0.3)] hover:shadow-[0_4px_28px_rgba(var(--primary-rgb),0.45)] transition-all"
                  onClick={handleStep1Next}
                >
                  Next — Cinema Hall Details
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}

            {/* ── Step 2: Hall Info ── */}
            {step === 2 && (
              <div className="px-7 py-7 space-y-5">
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center">
                    <Building2 className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <h2 className="text-base font-semibold text-white">First Cinema Hall Details</h2>
                </div>

                {error && (
                  <Alert variant="destructive" className="border-destructive/30 bg-destructive/8">
                    <AlertDescription className="text-sm">{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-1.5">
                  <Label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Hall Name</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                      placeholder="e.g. Grand Cineplex"
                      className="pl-10 h-11 bg-slate-800/50 border-slate-700/80 text-white placeholder:text-slate-600 focus:border-primary/70 focus:bg-slate-800 transition-colors"
                      value={form.name}
                      onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Full Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                      placeholder="e.g. 42 Anna Salai, Chennai"
                      className="pl-10 h-11 bg-slate-800/50 border-slate-700/80 text-white placeholder:text-slate-600 focus:border-primary/70 focus:bg-slate-800 transition-colors"
                      value={form.location}
                      onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">State</Label>
                    <Select value={form.state} onValueChange={handleStateChange}>
                      <SelectTrigger className="h-11 bg-slate-800/50 border-slate-700/80 text-white focus:border-primary/70">
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {IN_STATES.map((s) => (
                          <SelectItem key={s.isoCode} value={s.name}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">District</Label>
                    <Select
                      value={form.district}
                      onValueChange={(v) => setForm((p) => ({ ...p, district: v }))}
                      disabled={!form.state}
                    >
                      <SelectTrigger className="h-11 bg-slate-800/50 border-slate-700/80 text-white focus:border-primary/70 disabled:opacity-50">
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

                <div className="flex gap-3">
                  <Button
                    type="button" variant="ghost"
                    className="flex-1 h-11 border border-slate-700/80 text-slate-400 hover:text-white hover:border-slate-500 hover:bg-slate-800/50 transition-all"
                    onClick={() => setStep(1)}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back
                  </Button>
                  <Button
                    className="flex-[2] h-11 font-semibold shadow-[0_4px_20px_rgba(var(--primary-rgb),0.3)] hover:shadow-[0_4px_28px_rgba(var(--primary-rgb),0.45)] transition-all"
                    onClick={handleStep2Next}
                  >
                    Next — Set Location
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* ── Step 3: Location ── */}
            {step === 3 && (
              <div className="px-7 py-7 space-y-4">
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <h2 className="text-base font-semibold text-white">Pin Your Location</h2>
                  <span className="ml-auto text-xs text-slate-500 font-medium bg-slate-800/60 px-2 py-0.5 rounded-full border border-slate-700/50">Optional</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Helps customers find your hall on the map. You can skip this and add it later.
                </p>

                {/* Search */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                      placeholder="Search location…"
                      className="pl-10 h-10 bg-slate-800/50 border-slate-700/80 text-white placeholder:text-slate-600 focus:border-primary/70 focus:bg-slate-800 transition-colors"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    />
                  </div>
                  <Button
                    type="button" variant="outline"
                    className="h-10 px-3 border-slate-700/80 hover:border-slate-500 hover:bg-slate-800/60"
                    onClick={handleSearch} disabled={isSearching}
                  >
                    {isSearching
                      ? <span className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
                      : <Search className="w-4 h-4" />}
                  </Button>
                </div>

                {/* Map */}
                <div className="rounded-xl overflow-hidden border border-white/[0.08] shadow-[0_0_30px_rgba(0,0,0,0.4)]" style={{ height: 260 }}>
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
                  <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-primary/10 border border-primary/25 rounded-lg shadow-[0_0_16px_rgba(var(--primary-rgb),0.1)]">
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
                <div className="flex gap-2.5 pt-1">
                  <Button
                    type="button" variant="ghost"
                    className="flex-1 h-11 border border-slate-700/80 text-slate-400 hover:text-white hover:border-slate-500 hover:bg-slate-800/50 transition-all"
                    onClick={() => setStep(2)}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back
                  </Button>
                  <Button
                    type="button" variant="outline"
                    className="flex-1 h-11 border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all"
                    onClick={() => handleFinish(true)}
                    disabled={isSubmitting}
                  >
                    Skip for now
                  </Button>
                  <Button
                    className="flex-1 h-11 font-semibold shadow-[0_4px_20px_rgba(var(--primary-rgb),0.3)] hover:shadow-[0_4px_28px_rgba(var(--primary-rgb),0.45)] transition-all"
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
      </div>
    </>
  )
}

export function OnboardingPageSkeleton() {
  return (
    <>
      <div
        className="fixed inset-0 bg-gradient-to-br from-slate-950 via-[#180404] to-[#1a0a0a] -z-10"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      {/* Ambient blobs */}
      <div className="fixed top-1/4 -left-40 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-1/4 -right-40 w-[400px] h-[400px] bg-rose-900/15 rounded-full blur-3xl pointer-events-none -z-10" />
      <Film
        className="fixed inset-0 m-auto w-[42rem] h-[42rem] text-white/[0.015] pointer-events-none -z-10"
        strokeWidth={0.3}
      />

      <div className="h-full overflow-y-auto">
      <div className="min-h-full flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        {/* Sign-out placeholder */}
        <div className="flex justify-start mb-5">
          <Skeleton className="h-4 w-20 bg-slate-800" />
        </div>

        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-7">
          <Skeleton className="w-11 h-11 rounded-xl bg-slate-800" />
          <Skeleton className="h-5 w-36 bg-slate-800" />
        </div>

        {/* Hero heading */}
        <div className="flex flex-col items-center gap-3 mb-7">
          <Skeleton className="h-6 w-32 rounded-full bg-slate-800" />
          <Skeleton className="h-9 w-64 bg-slate-800" />
          <Skeleton className="h-4 w-80 bg-slate-800/60" />
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center mb-7">
          <Skeleton className="w-9 h-9 rounded-full bg-primary/30" />
          <Skeleton className="h-4 w-20 bg-slate-800 ml-2.5" />
          <Skeleton className="h-px w-14 bg-slate-800 mx-4" />
          <Skeleton className="w-9 h-9 rounded-full bg-slate-800" />
          <Skeleton className="h-4 w-16 bg-slate-800 ml-2.5" />
        </div>

        {/* Card */}
        <div className="relative bg-slate-900/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.6)] overflow-hidden">
          <div className="h-[3px] w-full bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          <div className="px-7 py-7 space-y-5">
          {/* Section title */}
          <div className="flex items-center gap-2.5">
            <Skeleton className="w-7 h-7 rounded-lg bg-slate-700" />
            <Skeleton className="h-5 w-40 bg-slate-700" />
          </div>
          {/* Hall name */}
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-20 bg-slate-700" />
            <Skeleton className="h-11 w-full rounded-md bg-slate-800" />
          </div>
          {/* Address */}
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-24 bg-slate-700" />
            <Skeleton className="h-11 w-full rounded-md bg-slate-800" />
          </div>
          {/* State / District */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-10 bg-slate-700" />
              <Skeleton className="h-11 w-full rounded-md bg-slate-800" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-16 bg-slate-700" />
              <Skeleton className="h-11 w-full rounded-md bg-slate-800" />
            </div>
          </div>
          {/* Button */}
          <Skeleton className="h-11 w-full rounded-md bg-primary/20" />
          </div>
        </div>
      </div>
      </div>
      </div>
    </>
  )
}
