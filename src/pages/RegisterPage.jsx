import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { PASSWORD_POLICY_CHECKS } from "@/utils/passwordPolicy"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { User, Mail, Lock, Phone, Film, Eye, EyeOff, CheckCircle } from "lucide-react"
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

  const allPolicyPassed = PASSWORD_POLICY_CHECKS.every((c) => c.test(formData.password))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) return setError("Full name is required.")
    if (!formData.phone.trim()) return setError("Phone number is required.")
    if (!formData.email.trim()) return setError("Email is required.")
    if (!allPolicyPassed) return setError("Password does not meet the required policy.")

    setError("")
    setIsLoading(true)
    try {
      const result = await register(formData)
      if (result.success) {
        toast.success("Account created! Please verify your email.")
        navigate(`/verify-email?email=${encodeURIComponent(formData.email)}`)
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
    <>
      {/* Fixed decorative background */}
      <div
        className="fixed inset-0 bg-gradient-to-br from-slate-950 via-[#180404] to-[#1a0a0a] -z-10"
        style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)", backgroundSize: "28px 28px" }}
      />
      <div className="fixed top-1/4 -left-32 w-[28rem] h-[28rem] bg-primary/15 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-1/4 -right-32 w-80 h-80 bg-rose-900/20 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/5 rounded-full blur-3xl pointer-events-none -z-10" />
      <Film className="fixed inset-0 m-auto w-[42rem] h-[42rem] text-white/[0.015] pointer-events-none -z-10" strokeWidth={0.3} />

      {/* Scrollable page */}
      <div className="h-full overflow-y-auto">
      <div className="min-h-full flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-11 h-11 bg-primary/20 border border-primary/40 rounded-xl flex items-center justify-center shadow-[0_0_24px_rgba(var(--primary-rgb),0.25)]">
              <Film className="w-5 h-5 text-primary" />
            </div>
            <span className="text-white font-bold text-xl tracking-wide">CineMax Admin</span>
          </div>

          {/* Card */}
          <div className="relative bg-slate-900/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.6)] overflow-hidden">
            {/* Accent top bar */}
            <div className="h-[3px] w-full bg-gradient-to-r from-transparent via-primary to-transparent opacity-80" />

            <div className="px-7 py-8">
              <div className="text-center mb-7">
                <h2 className="text-2xl font-bold text-white tracking-tight">Create your account</h2>
                <p className="text-slate-400 text-sm mt-1.5 leading-relaxed">
                  Enter your details to get started — add your hall after sign in
                </p>
              </div>

              {error && (
                <Alert variant="destructive" className="mb-5 border-destructive/30 bg-destructive/8">
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <Input
                        name="name" type="text" placeholder="John Doe"
                        className="pl-10 h-11 bg-slate-800/50 border-slate-700/80 text-white placeholder:text-slate-600 focus:border-primary/70 focus:bg-slate-800 transition-colors"
                        value={formData.name} onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <Input
                        name="phone" type="tel" placeholder="+91 98765 43210"
                        className="pl-10 h-11 bg-slate-800/50 border-slate-700/80 text-white placeholder:text-slate-600 focus:border-primary/70 focus:bg-slate-800 transition-colors"
                        value={formData.phone} onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                      name="email" type="email" placeholder="admin@cinema.com"
                      className="pl-10 h-11 bg-slate-800/50 border-slate-700/80 text-white placeholder:text-slate-600 focus:border-primary/70 focus:bg-slate-800 transition-colors"
                      value={formData.email} onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                      name="password" type={showPassword ? "text" : "password"} placeholder="Min 8 characters"
                      className="pl-10 pr-11 h-11 bg-slate-800/50 border-slate-700/80 text-white placeholder:text-slate-600 focus:border-primary/70 focus:bg-slate-800 transition-colors"
                      value={formData.password} onChange={handleChange}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {/* Policy checklist */}
                  {formData.password.length > 0 && (
                    <div className="mt-2 p-3 bg-slate-800/40 rounded-lg border border-slate-700/50">
                      <ul className="space-y-1">
                        {PASSWORD_POLICY_CHECKS.map((check) => {
                          const passed = check.test(formData.password)
                          return (
                            <li key={check.label} className={`flex items-center gap-2 text-xs transition-colors ${passed ? "text-emerald-400" : "text-slate-500"}`}>
                              <CheckCircle className={`w-3.5 h-3.5 flex-shrink-0 transition-colors ${passed ? "text-emerald-400" : "text-slate-700"}`} />
                              {check.label}
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="pt-2 space-y-3">
                  <Button
                    type="submit"
                    className="w-full h-11 font-semibold bg-primary hover:bg-primary/90 shadow-[0_4px_24px_rgba(var(--primary-rgb),0.35)] hover:shadow-[0_4px_28px_rgba(var(--primary-rgb),0.5)] transition-all"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Creating account…
                      </span>
                    ) : "Create Account"}
                  </Button>
                  <Button
                    type="button" variant="ghost"
                    className="w-full h-11 text-slate-400 hover:text-white border border-slate-700/80 hover:border-slate-500 hover:bg-slate-800/50 transition-all"
                    onClick={() => navigate("/login")}
                  >
                    Back to Login
                  </Button>
                </div>
              </form>

              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-slate-800" />
                <p className="text-xs text-slate-600">
                  By signing up you agree to our{" "}
                  <span className="text-primary/80 cursor-pointer hover:text-primary transition-colors">Terms</span>
                  {" "}&amp;{" "}
                  <span className="text-primary/80 cursor-pointer hover:text-primary transition-colors">Privacy Policy</span>
                </p>
                <div className="flex-1 h-px bg-slate-800" />
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  )
}

