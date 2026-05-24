import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { User, Mail, Lock, Phone, Film, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"

export const RegisterPage = () => {
  const [formData, setFormData] = useState({ name: "", email: "", password: "", phone: "" })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { register } = useAuth()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(p => ({ ...p, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) return setError("Full name is required.")
    if (!formData.phone.trim()) return setError("Phone number is required.")
    if (!formData.email.trim()) return setError("Email is required.")
    if (!formData.password.trim()) return setError("Password is required.")
    if (formData.password.length < 6) return setError("Password must be at least 6 characters.")

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
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-950 via-[#180404] to-[#1a0a0a] px-4 py-10"
      style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.035) 1px, transparent 1px)", backgroundSize: "28px 28px" }}
    >
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-rose-900/20 rounded-full blur-3xl pointer-events-none" />
      <Film className="absolute inset-0 m-auto w-[36rem] h-[36rem] text-white/[0.018] pointer-events-none" strokeWidth={0.4} />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 bg-primary/20 border border-primary/30 rounded-xl flex items-center justify-center">
            <Film className="w-5 h-5 text-primary" />
          </div>
          <span className="text-white font-bold text-lg tracking-wide">CineMax Admin</span>
        </div>

        <div className="bg-slate-900/70 backdrop-blur-md border border-white/[0.07] rounded-2xl px-6 py-8 shadow-2xl">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white">Create your account</h2>
            <p className="text-slate-400 text-sm mt-1">
              Enter your details to get started — add your hall after sign in
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-5 border-destructive/20 bg-destructive/5">
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  name="password" type={showPassword ? "text" : "password"} placeholder="Min 6 characters"
                  className="pl-10 pr-10 h-11 bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-primary"
                  value={formData.password} onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2 space-y-3">
              <Button type="submit" className="w-full h-11 font-semibold" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Creating account…
                  </span>
                ) : "Create Account"}
              </Button>
              <Button
                type="button" variant="ghost"
                className="w-full h-11 text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500"
                onClick={() => navigate("/login")}
              >
                Back to Login
              </Button>
            </div>
          </form>

          <p className="text-center text-xs text-slate-500 mt-5">
            By creating an account, you agree to our{" "}
            <span className="text-primary cursor-pointer hover:underline">Terms of Service</span>
            {" "}and{" "}
            <span className="text-primary cursor-pointer hover:underline">Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
  )
}

