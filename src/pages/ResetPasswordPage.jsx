import { useState, useEffect } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { authAPI } from "@/services/api"
import { PASSWORD_POLICY_CHECKS } from "@/utils/passwordPolicy"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Film, Lock, Eye, EyeOff, CheckCircle, XCircle, Loader2, ArrowLeft } from "lucide-react"
import { toast } from "sonner"

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get("token")

  const [tokenStatus, setTokenStatus] = useState("idle") // idle | valid | invalid | expired
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  // We don't pre-validate the token; the submit will surface errors.
  // Just check the token param exists in the URL.
  useEffect(() => {
    if (!token) setTokenStatus("invalid")
    else setTokenStatus("valid")
  }, [token])

  const allPolicyPassed = PASSWORD_POLICY_CHECKS.every((c) => c.test(newPassword))
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (!allPolicyPassed) {
      setError("Password does not meet the required policy.")
      return
    }
    if (!passwordsMatch) {
      setError("Passwords do not match.")
      return
    }

    setIsLoading(true)
    try {
      await authAPI.resetPassword(token, newPassword)
      setSuccess(true)
      toast.success("Password reset successfully!")
    } catch (err) {
      const code = err?.data?.code
      if (code === "TOKEN_EXPIRED") {
        setTokenStatus("expired")
      } else if (code === "INVALID_TOKEN" || code === "TOKEN_USED") {
        setTokenStatus("invalid")
      } else {
        setError(err.message || "Password reset failed. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  // ── Invalid / expired states ───────────────────────────────────────────────
  if (tokenStatus === "invalid" || tokenStatus === "expired") {
    return (
      <AuthShell>
        <div className="flex flex-col items-center text-center gap-4 py-4">
          <div className="w-14 h-14 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center">
            <XCircle className="w-7 h-7 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white">
            {tokenStatus === "expired" ? "Link expired" : "Invalid link"}
          </h2>
          <p className="text-slate-400 text-sm max-w-xs">
            {tokenStatus === "expired"
              ? "This password reset link has expired (links are valid for 15 minutes). Please request a new one."
              : "This password reset link is invalid or has already been used."}
          </p>
          <Button className="w-full" onClick={() => navigate("/forgot-password")}>
            Request New Link
          </Button>
          <Button variant="ghost" className="text-slate-400 hover:text-white border border-slate-700 w-full" onClick={() => navigate("/login")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Sign In
          </Button>
        </div>
      </AuthShell>
    )
  }

  // ── Success state ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <AuthShell>
        <div className="flex flex-col items-center text-center gap-4 py-4">
          <div className="w-14 h-14 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center">
            <CheckCircle className="w-7 h-7 text-green-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Password reset!</h2>
          <p className="text-slate-400 text-sm">Your password has been updated. All other active sessions have been signed out.</p>
          <Button className="w-full" onClick={() => navigate("/login")}>
            Sign In
          </Button>
        </div>
      </AuthShell>
    )
  }

  // ── Reset form ─────────────────────────────────────────────────────────────
  return (
    <AuthShell>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Set new password</h2>
        <p className="text-slate-400 text-sm mt-1">Choose a strong password for your account.</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-5 border-destructive/20 bg-destructive/5">
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label className="text-slate-300 text-sm font-medium">New Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="New password"
              className="pl-10 pr-10 h-11 bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-primary"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Password policy checklist */}
        {newPassword.length > 0 && (
          <ul className="space-y-1 px-1">
            {PASSWORD_POLICY_CHECKS.map((check) => {
              const passed = check.test(newPassword)
              return (
                <li key={check.label} className={`flex items-center gap-2 text-xs ${passed ? "text-green-400" : "text-slate-500"}`}>
                  <CheckCircle className={`w-3.5 h-3.5 flex-shrink-0 ${passed ? "text-green-400" : "text-slate-600"}`} />
                  {check.label}
                </li>
              )
            })}
          </ul>
        )}

        <div className="space-y-2">
          <Label className="text-slate-300 text-sm font-medium">Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              type={showConfirm ? "text" : "password"}
              placeholder="Confirm new password"
              className={`pl-10 pr-10 h-11 bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-primary ${confirmPassword && !passwordsMatch ? "border-destructive" : ""}`}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {confirmPassword && !passwordsMatch && (
            <p className="text-xs text-destructive">Passwords do not match.</p>
          )}
        </div>

        <div className="pt-1 space-y-3">
          <Button
            type="submit"
            className="w-full h-11 font-semibold"
            disabled={isLoading || !allPolicyPassed || !passwordsMatch}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Resetting…
              </span>
            ) : "Reset Password"}
          </Button>
        </div>
      </form>
    </AuthShell>
  )
}

const AuthShell = ({ children }) => (
  <div
    className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-950 via-[#180404] to-[#1a0a0a] px-4 py-10"
    style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.035) 1px, transparent 1px)", backgroundSize: "28px 28px" }}
  >
    <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/15 rounded-full blur-3xl pointer-events-none" />
    <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-rose-900/20 rounded-full blur-3xl pointer-events-none" />
    <Film className="absolute inset-0 m-auto w-[36rem] h-[36rem] text-white/[0.018] pointer-events-none" strokeWidth={0.4} />
    <div className="relative z-10 w-full max-w-md">
      <div className="flex items-center justify-center gap-2.5 mb-8">
        <div className="w-10 h-10 bg-primary/20 border border-primary/30 rounded-xl flex items-center justify-center">
          <Film className="w-5 h-5 text-primary" />
        </div>
        <span className="text-white font-bold text-lg tracking-wide">CineMax Admin</span>
      </div>
      <div className="bg-slate-900/70 backdrop-blur-md border border-white/[0.07] rounded-2xl px-6 py-8 shadow-2xl">
        {children}
      </div>
    </div>
  </div>
)
