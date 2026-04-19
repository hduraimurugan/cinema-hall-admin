import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { User, Mail, Lock, Phone, Building, MapPin, Film, Clapperboard, Ticket, LayoutDashboard, ArrowLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { State, City } from 'country-state-city'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"

const FilmStrip = () => (
  <div className="flex gap-1">
    {Array.from({ length: 40 }).map((_, i) => (
      <div key={i} className="w-6 h-4 rounded-sm bg-white/10 flex-shrink-0" />
    ))}
  </div>
)

const LeftPanel = () => (
  <div className="hidden lg:flex lg:w-1/2 flex-col relative overflow-hidden bg-gradient-to-br from-slate-950 via-[#1a0505] to-[#2d0a0a]">
    {/* Film strip top */}
    <div className="absolute top-0 left-0 right-0 py-2 px-2 bg-black/40 overflow-hidden">
      <FilmStrip />
    </div>

    {/* Background orbs */}
    <div className="absolute top-1/4 -left-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
    <div className="absolute bottom-1/4 right-0 w-56 h-56 bg-rose-900/30 rounded-full blur-3xl" />
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-primary/10 rounded-full blur-2xl" />

    {/* Content */}
    <div className="relative flex flex-col justify-between h-full px-10 pt-20 pb-16">
      <div>
        <div className="flex items-center gap-3 mb-12">
          <div className="w-12 h-12 bg-primary/20 border border-primary/30 rounded-xl flex items-center justify-center">
            <Film className="w-6 h-6 text-primary" />
          </div>
          <span className="text-white font-bold text-xl tracking-wide">Cinema Admin</span>
        </div>

        <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4">
          Start Managing
          <br />
          <span className="bg-gradient-to-r from-primary to-rose-400 bg-clip-text text-transparent">
            Your Cinema.
          </span>
        </h1>
        <p className="text-slate-400 text-base leading-relaxed max-w-xs">
          Join hundreds of cinema operators using our platform. Set up your hall in minutes and go live today.
        </p>
      </div>

      {/* Feature list */}
      <div className="space-y-4 my-10">
        {[
          { icon: LayoutDashboard, label: "Instant Dashboard Access", desc: "Full analytics from day one" },
          { icon: Ticket, label: "Automated Booking System", desc: "Handle reservations effortlessly" },
          { icon: Clapperboard, label: "Flexible Screen Layouts", desc: "Custom seat maps & pricing tiers" },
        ].map((feature) => {
          const FeatureIcon = feature.icon
          return (
            <div key={feature.label} className="flex items-start gap-4 group">
              <div className="w-10 h-10 bg-primary/15 border border-primary/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-primary/25 transition-colors">
                <FeatureIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-white text-sm font-medium">{feature.label}</p>
                <p className="text-slate-500 text-xs mt-0.5">{feature.desc}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { value: "Free", label: "To Get Started" },
          { value: "5 min", label: "Setup Time" },
          { value: "500+", label: "Active Halls" },
          { value: "24/7", label: "Support Access" },
        ].map(({ value, label }) => (
          <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-sm">
            <p className="text-primary font-bold text-lg">{value}</p>
            <p className="text-slate-400 text-xs mt-0.5">{label}</p>
          </div>
        ))}
      </div>
    </div>

    {/* Film strip bottom */}
    <div className="absolute bottom-0 left-0 right-0 py-2 px-2 bg-black/40 overflow-hidden">
      <FilmStrip />
    </div>
  </div>
)

export const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    hall_name: "",
    hall_location: "",
    hall_district: "",
    hall_state: ""
  })
  const [states, setStates] = useState([])
  const [cities, setCities] = useState([])
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { register } = useAuth()

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    try {
      const result = await register(formData)
      if (result.success) {
        toast.success("Account created successfully! Please sign in.")
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

  useEffect(() => {
    setStates(State.getStatesOfCountry("IN"))
  }, [])

  useEffect(() => {
    if (formData.hall_state) {
      const selected = states.find((s) => s.name === formData.hall_state)
      if (selected) setCities(City.getCitiesOfState("IN", selected.isoCode))
    }
  }, [formData.hall_state, states])

  return (
    <div className="h-screen flex overflow-hidden">
      <LeftPanel />

      {/* Right panel — scrollable */}
      <div className="w-full lg:w-1/2 h-full overflow-y-auto bg-background flex flex-col">
        <div className="flex-1 flex flex-col justify-center px-6 py-12">
          <div className="w-full max-w-sm mx-auto">
            {/* Mobile logo */}
            <div className="flex lg:hidden items-center gap-2 justify-center mb-8">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Film className="w-5 h-5 text-primary" />
              </div>
              <span className="font-bold text-lg text-foreground">Cinema Admin</span>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-foreground">Create your account</h2>
              <p className="text-muted-foreground text-sm mt-1">Get started managing your cinema hall</p>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-6 border-destructive/20 bg-destructive/5">
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleRegister} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">Personal Information</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name" name="name" type="text" placeholder="John Doe"
                        className="pl-10 h-11" value={formData.name}
                        onChange={handleInputChange} required disabled={isLoading}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium">Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone" name="phone" type="tel" placeholder="+91 98765 43210"
                        className="pl-10 h-11" value={formData.phone}
                        onChange={handleInputChange} required disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email" name="email" type="email" placeholder="admin@cinema.com"
                      className="pl-10 h-11" value={formData.email}
                      onChange={handleInputChange} required disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password" name="password" type="password" placeholder="••••••••"
                      className="pl-10 h-11" value={formData.password}
                      onChange={handleInputChange} required disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Cinema Hall Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">Cinema Hall Details</span>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hall_name" className="text-sm font-medium">Hall Name</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="hall_name" name="hall_name" type="text" placeholder="Grand Cinema Hall"
                      className="pl-10 h-11" value={formData.hall_name}
                      onChange={handleInputChange} required disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hall_location" className="text-sm font-medium">Full Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="hall_location" name="hall_location" type="text" placeholder="123 Main Street"
                      className="pl-10 h-11" value={formData.hall_location}
                      onChange={handleInputChange} required disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">State</Label>
                    <Select
                      value={formData.hall_state}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, hall_state: value, hall_district: "" }))
                      }
                      disabled={isLoading}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select State" />
                      </SelectTrigger>
                      <SelectContent>
                        {states.map((state) => (
                          <SelectItem key={state.isoCode} value={state.name}>{state.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">District</Label>
                    <Select
                      value={formData.hall_district}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, hall_district: value }))
                      }
                      disabled={isLoading || !formData.hall_state}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select District" />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.map((city) => (
                          <SelectItem key={city.name} value={city.name}>{city.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button" variant="outline"
                  className="flex-1 h-11"
                  onClick={() => navigate("/login")}
                  disabled={isLoading}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button type="submit" className="flex-1 h-11 font-medium" disabled={isLoading}>
                  {isLoading ? "Creating..." : (
                    <span className="flex items-center gap-2">
                      Create Account <ChevronRight className="w-4 h-4" />
                    </span>
                  )}
                </Button>
              </div>
            </form>

            <p className="text-xs text-muted-foreground text-center mt-6">
              By creating an account, you agree to our{" "}
              <a href="#" className="text-primary hover:underline font-medium">Terms of Service</a>
              {" "}and{" "}
              <a href="#" className="text-primary hover:underline font-medium">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
