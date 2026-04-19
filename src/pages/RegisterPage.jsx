import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  User, Mail, Lock, Phone, Building, MapPin, Film,
  ChevronRight, ArrowLeft, Search, Navigation, CheckCircle2,
} from "lucide-react"
import { toast } from "sonner"
import { State, City } from "country-state-city"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Fix Leaflet default icon paths broken by bundlers
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
})

const STEPS = [
  { id: 1, label: "Personal Info", icon: User },
  { id: 2, label: "Hall Details", icon: Building },
  { id: 3, label: "Location", icon: MapPin },
]

function MapClickHandler({ onLocationPick }) {
  useMapEvents({
    click(e) {
      onLocationPick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

function DraggableMarker({ position, onDrag }) {
  if (!position) return null
  const markerRef = { current: null }
  return (
    <Marker
      position={position}
      draggable
      ref={markerRef}
      eventHandlers={{
        dragend(e) {
          const latlng = e.target.getLatLng()
          onDrag(latlng.lat, latlng.lng)
        },
      }}
    />
  )
}

const StepIndicator = ({ current }) => (
  <div className="flex items-center justify-center gap-0 mb-8">
    {STEPS.map((step, idx) => {
      const StepIcon = step.icon
      const done = current > step.id
      const active = current === step.id
      return (
        <div key={step.id} className="flex items-center">
          <div className="flex flex-col items-center gap-1">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                done
                  ? "bg-primary border-primary text-primary-foreground"
                  : active
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground"
              }`}
            >
              {done ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <StepIcon className="w-4 h-4" />
              )}
            </div>
            <span
              className={`text-[11px] font-medium hidden sm:block ${
                active ? "text-primary" : done ? "text-primary/70" : "text-muted-foreground"
              }`}
            >
              {step.label}
            </span>
          </div>
          {idx < STEPS.length - 1 && (
            <div
              className={`w-16 sm:w-24 h-0.5 mb-5 mx-1 transition-all duration-300 ${
                current > step.id ? "bg-primary" : "bg-border"
              }`}
            />
          )}
        </div>
      )
    })}
  </div>
)

export const RegisterPage = () => {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: "", email: "", password: "", phone: "",
    hall_name: "", hall_location: "", hall_district: "", hall_state: "",
    latitude: null, longitude: null,
  })
  const [states, setStates] = useState([])
  const [cities, setCities] = useState([])
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629])
  const [markerPos, setMarkerPos] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { register } = useAuth()

  useEffect(() => { setStates(State.getStatesOfCountry("IN")) }, [])

  useEffect(() => {
    if (formData.hall_state) {
      const selected = states.find((s) => s.name === formData.hall_state)
      if (selected) setCities(City.getCitiesOfState("IN", selected.isoCode))
    }
  }, [formData.hall_state, states])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((p) => ({ ...p, [name]: value }))
  }

  const handleLocationPick = useCallback((lat, lng) => {
    setMarkerPos([lat, lng])
    setFormData((p) => ({ ...p, latitude: lat, longitude: lng }))
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
        const { lat, lon } = data[0]
        const numLat = parseFloat(lat)
        const numLon = parseFloat(lon)
        setMapCenter([numLat, numLon])
        handleLocationPick(numLat, numLon)
      } else {
        toast.error("Location not found. Try a different search.")
      }
    } catch {
      toast.error("Search failed. Please try again.")
    } finally {
      setIsSearching(false)
    }
  }

  const validateStep = () => {
    if (step === 1) {
      if (!formData.name.trim()) return "Full name is required."
      if (!formData.phone.trim()) return "Phone number is required."
      if (!formData.email.trim()) return "Email is required."
      if (!formData.password.trim()) return "Password is required."
      if (formData.password.length < 6) return "Password must be at least 6 characters."
    }
    if (step === 2) {
      if (!formData.hall_name.trim()) return "Hall name is required."
      if (!formData.hall_location.trim()) return "Address is required."
      if (!formData.hall_state) return "Please select a state."
      if (!formData.hall_district) return "Please select a district."
    }
    return null
  }

  const handleNext = () => {
    const err = validateStep()
    if (err) { setError(err); return }
    setError("")
    setStep((s) => s + 1)
  }

  const handleBack = () => {
    setError("")
    setStep((s) => s - 1)
  }

  const handleSubmit = async () => {
    if (!formData.latitude || !formData.longitude) {
      setError("Please pick your cinema hall location on the map.")
      return
    }
    setError("")
    setIsLoading(true)
    try {
      const result = await register(formData)
      if (result.success) {
        toast.success("Account created! Please sign in.")
        navigate("/login")
      } else {
        setError(result.message || "Registration failed")
        toast.error(result.message || "Registration failed")
      }
    } catch {
      setError("Something went wrong. Please try again.")
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-950 via-[#180404] to-[#1a0a0a] px-4 py-10"
      style={{
        backgroundImage:
          "radial-gradient(rgba(255,255,255,0.035) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }}
    >
      {/* Glow orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-rose-900/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-2/3 left-1/2 w-64 h-64 bg-primary/8 rounded-full blur-2xl pointer-events-none" />
      {/* Watermark */}
      <Film
        className="absolute inset-0 m-auto w-[36rem] h-[36rem] text-white/[0.018] pointer-events-none"
        strokeWidth={0.4}
      />

      <div className="relative z-10 w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 bg-primary/20 border border-primary/30 rounded-xl flex items-center justify-center">
            <Film className="w-5 h-5 text-primary" />
          </div>
          <span className="text-white font-bold text-lg tracking-wide">Cinema Admin</span>
        </div>

        {/* Card */}
        <div className="bg-slate-900/70 backdrop-blur-md border border-white/[0.07] rounded-2xl px-6 py-8 shadow-2xl">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white">Create your account</h2>
            <p className="text-slate-400 text-sm mt-1">
              {step === 1 && "Start with your personal details"}
              {step === 2 && "Tell us about your cinema hall"}
              {step === 3 && "Pin your cinema hall on the map"}
            </p>
          </div>

          <StepIndicator current={step} />

          {error && (
            <Alert variant="destructive" className="mb-5 border-destructive/20 bg-destructive/5">
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}

          {/* ── Step 1: Personal Info ── */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-slate-300 text-sm font-medium">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                      name="name" type="text" placeholder="John Doe"
                      className="pl-10 h-11 bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-primary"
                      value={formData.name} onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300 text-sm font-medium">Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                      name="phone" type="tel" placeholder="+91 98765 43210"
                      className="pl-10 h-11 bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-primary"
                      value={formData.phone} onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300 text-sm font-medium">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    name="email" type="email" placeholder="admin@cinema.com"
                    className="pl-10 h-11 bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-primary"
                    value={formData.email} onChange={handleChange}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300 text-sm font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    name="password" type="password" placeholder="Min 6 characters"
                    className="pl-10 h-11 bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-primary"
                    value={formData.password} onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Hall Details ── */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300 text-sm font-medium">Hall Name</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    name="hall_name" type="text" placeholder="Grand Cinema Hall"
                    className="pl-10 h-11 bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-primary"
                    value={formData.hall_name} onChange={handleChange}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300 text-sm font-medium">Full Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    name="hall_location" type="text" placeholder="123 Main Street"
                    className="pl-10 h-11 bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-primary"
                    value={formData.hall_location} onChange={handleChange}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-slate-300 text-sm font-medium">State</Label>
                  <Select
                    value={formData.hall_state}
                    onValueChange={(v) =>
                      setFormData((p) => ({ ...p, hall_state: v, hall_district: "" }))
                    }
                  >
                    <SelectTrigger className="h-11 bg-slate-800/60 border-slate-700 text-white">
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
                  <Label className="text-slate-300 text-sm font-medium">District</Label>
                  <Select
                    value={formData.hall_district}
                    onValueChange={(v) => setFormData((p) => ({ ...p, hall_district: v }))}
                    disabled={!formData.hall_state}
                  >
                    <SelectTrigger className="h-11 bg-slate-800/60 border-slate-700 text-white">
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
            </div>
          )}

          {/* ── Step 3: Map Location ── */}
          {step === 3 && (
            <div className="space-y-4">
              {/* Search */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    placeholder="Search your cinema location…"
                    className="pl-10 h-10 bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-primary"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
                <Button
                  type="button" variant="outline"
                  className="h-10 px-3 border-slate-700 text-slate-300 hover:text-white hover:border-primary"
                  onClick={handleSearch}
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {/* Map */}
              <div className="rounded-xl overflow-hidden border border-slate-700 shadow-lg" style={{ height: 280 }}>
                <MapContainer
                  center={mapCenter}
                  zoom={5}
                  style={{ height: "100%", width: "100%" }}
                  key={`${mapCenter[0]}-${mapCenter[1]}`}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <MapClickHandler onLocationPick={handleLocationPick} />
                  <DraggableMarker position={markerPos} onDrag={handleLocationPick} />
                </MapContainer>
              </div>

              {/* Coordinates display */}
              {markerPos ? (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-primary/10 border border-primary/20 rounded-lg">
                  <Navigation className="w-4 h-4 text-primary flex-shrink-0" />
                  <p className="text-sm text-primary font-medium">
                    {markerPos[0].toFixed(6)}, {markerPos[1].toFixed(6)}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-500 text-center">
                  Click the map or drag the pin to mark your cinema hall location
                </p>
              )}
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex gap-3 mt-6">
            {step === 1 ? (
              <Button
                type="button" variant="outline"
                className="flex-1 h-11 border-slate-700 text-slate-300 hover:text-white"
                onClick={() => navigate("/login")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            ) : (
              <Button
                type="button" variant="outline"
                className="flex-1 h-11 border-slate-700 text-slate-300 hover:text-white"
                onClick={handleBack}
                disabled={isLoading}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}

            {step < 3 ? (
              <Button type="button" className="flex-1 h-11 font-medium" onClick={handleNext}>
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="button"
                className="flex-1 h-11 font-medium"
                onClick={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Creating…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Create Account
                    <ChevronRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            )}
          </div>

          <p className="text-xs text-slate-500 text-center mt-5">
            By creating an account, you agree to our{" "}
            <a href="#" className="text-primary hover:underline">Terms of Service</a>
            {" "}and{" "}
            <a href="#" className="text-primary hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
