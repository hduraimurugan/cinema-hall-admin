import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useGoogleLogin } from "@react-oauth/google"
import { useAuth } from "../../context/AuthContext"
import { PASSWORD_POLICY_CHECKS } from "@/utils/passwordPolicy"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { User, Mail, Lock, Phone, Eye, EyeOff, CheckCircle, RefreshCw } from "lucide-react"
import { toast } from "sonner"

export const RegisterForm = () => {
  const [formData, setFormData] = useState({ name: "", email: "", password: "", phone: "" })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)
  const navigate = useNavigate()
  const { register, googleLogin } = useAuth()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(p => ({ ...p, [name]: value }))
  }

  const allPolicyPassed = PASSWORD_POLICY_CHECKS.every((c) => c.test(formData.password))

  // Google OAuth signup
  const handleGoogleSignup = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setOauthLoading(true);
      setError('');
      try {
        const result = await googleLogin(tokenResponse.access_token);
        if (result.success) {
          toast.success("Welcome!");
          navigate('/');
        } else {
          setError(result.message || 'Google signup failed');
          toast.error(result.message || 'Google signup failed');
        }
      } catch {
        setError('Google signup failed. Please try again.');
        toast.error('Google signup failed. Please try again.');
      } finally {
        setOauthLoading(false);
      }
    },
    onError: () => {
      toast.error('Google signup was cancelled.');
      setOauthLoading(false);
    },
  });

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
    <div className="w-full max-w-md mx-auto">
      <div className="text-center lg:text-left mb-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">Create your account</h2>
        <p className="text-slate-400 text-sm mt-1.5 leading-relaxed animate-fade-in">
          Enter your details to get started — add your hall after sign in
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-5 border-destructive/30 bg-destructive/8">
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-slide-up-1">
          <div className="space-y-1.5">
            <Label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                name="name" type="text" placeholder="John Doe"
                className="pl-10 h-11 bg-slate-800/50 border-slate-700/80 text-white placeholder:text-slate-600 focus-visible:ring-primary/50 focus:bg-slate-800 transition-colors"
                value={formData.name} onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Phone</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                name="phone" type="tel" placeholder="+91 98765 43210"
                className="pl-10 h-11 bg-slate-800/50 border-slate-700/80 text-white placeholder:text-slate-600 focus-visible:ring-primary/50 focus:bg-slate-800 transition-colors"
                value={formData.phone} onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        <div className="space-y-1.5 animate-slide-up-2">
          <Label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Email Address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              name="email" type="email" placeholder="admin@cinema.com"
              className="pl-10 h-11 bg-slate-800/50 border-slate-700/80 text-white placeholder:text-slate-600 focus-visible:ring-primary/50 focus:bg-slate-800 transition-colors"
              value={formData.email} onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="space-y-1.5 animate-slide-up-3">
          <Label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              name="password" type={showPassword ? "text" : "password"} placeholder="Min 8 characters"
              className="pl-10 pr-11 h-11 bg-slate-800/50 border-slate-700/80 text-white placeholder:text-slate-600 focus-visible:ring-primary/50 focus:bg-slate-800 transition-colors"
              value={formData.password} onChange={handleChange}
              required
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {/* Policy checklist */}
          {formData.password.length > 0 && (
            <div className="mt-2 p-3 bg-slate-800/40 rounded-lg border border-slate-700/50 animate-in fade-in zoom-in-95 duration-200">
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

        <div className="pt-4 space-y-3 animate-slide-up-4">
          <Button
            type="submit"
            className="w-full h-11 font-semibold bg-primary hover:bg-primary/90 shadow-[0_4px_24px_rgba(var(--primary-rgb),0.35)] hover:shadow-[0_4px_28px_rgba(var(--primary-rgb),0.5)] transition-all"
            disabled={isLoading || oauthLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Creating account…
              </span>
            ) : "Create Account"}
          </Button>

          {/* OAuth Separator */}
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground font-medium">Or</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full h-11 font-medium border-border/60 hover:bg-muted/50 transition-all"
            onClick={() => handleGoogleSignup()}
            disabled={isLoading || oauthLoading}
          >
            {oauthLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            Continue with Google
          </Button>

          <Button
            type="button" variant="ghost"
            className="w-full h-11 text-slate-400 hover:text-white border border-slate-700/80 hover:border-slate-500 hover:bg-slate-800/50 transition-all"
            onClick={() => navigate("/login")}
            disabled={isLoading || oauthLoading}
          >
            Back to Login
          </Button>
        </div>
      </form>
    </div>
  )
}
