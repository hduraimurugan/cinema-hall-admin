import { useState, useEffect } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { authAPI } from "@/services/api"
import { PASSWORD_POLICY_CHECKS } from "@/utils/passwordPolicy"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Lock, Eye, EyeOff, CheckCircle, XCircle, Loader2, ArrowLeft } from "lucide-react"
import { toast } from "sonner"

export const ResetPasswordForm = () => {
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

  // Validate presence of token
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
      <div className="flex flex-col items-center text-center gap-4 py-4 animate-in fade-in duration-300">
        <div className="w-14 h-14 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center">
          <XCircle className="w-7 h-7 text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-white">
          {tokenStatus === "expired" ? "Link expired" : "Invalid link"}
        </h2>
        <p className="text-slate-400 text-sm max-w-xs leading-relaxed">
          {tokenStatus === "expired"
            ? "This password reset link has expired (links are valid for 15 minutes). Please request a new one."
            : "This password reset link is invalid or has already been used."}
        </p>
        <Button className="w-full h-11 bg-primary hover:bg-primary/95 text-white shadow-lg shadow-primary/20" onClick={() => navigate("/forgot-password")}>
          Request New Link
        </Button>
        <Button variant="ghost" className="text-slate-400 hover:text-white border border-slate-700 w-full h-11 transition-all" onClick={() => navigate("/login")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Sign In
        </Button>
      </div>
    )
  }

  // ── Success state ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="flex flex-col items-center text-center gap-4 py-4 animate-in fade-in zoom-in-95 duration-300">
        <div className="w-14 h-14 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center shadow-lg shadow-green-500/10">
          <CheckCircle className="w-7 h-7 text-green-400" />
        </div>
        <h2 className="text-xl font-bold text-white">Password reset!</h2>
        <p className="text-slate-400 text-sm leading-relaxed">Your password has been updated. All other active sessions have been signed out.</p>
        <Button className="w-full h-11 bg-primary hover:bg-primary/95 text-white shadow-lg shadow-primary/20" onClick={() => navigate("/login")}>
          Sign In
        </Button>
      </div>
    )
  }

  // ── Reset form ─────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="mb-6 text-center lg:text-left">
        <h2 className="text-2xl font-bold text-white">Set new password</h2>
        <p className="text-slate-400 text-sm mt-1 leading-relaxed">Choose a strong password for your account.</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-5 border-destructive/20 bg-destructive/5 animate-in fade-in duration-300">
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
              className="pl-10 pr-10 h-11 bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-primary/50"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isLoading}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Password policy checklist */}
        {newPassword.length > 0 && (
          <div className="mt-2 p-3 bg-slate-800/40 rounded-lg border border-slate-700/50 animate-in fade-in zoom-in-95 duration-200">
            <ul className="space-y-1">
              {PASSWORD_POLICY_CHECKS.map((check) => {
                const passed = check.test(newPassword)
                return (
                  <li key={check.label} className={`flex items-center gap-2 text-xs ${passed ? "text-green-400" : "text-slate-500"}`}>
                    <CheckCircle className={`w-3.5 h-3.5 flex-shrink-0 transition-colors ${passed ? "text-green-400" : "text-slate-700"}`} />
                    {check.label}
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        <div className="space-y-2">
          <Label className="text-slate-300 text-sm font-medium">Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              type={showConfirm ? "text" : "password"}
              placeholder="Confirm new password"
              className={`pl-10 pr-10 h-11 bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-primary/50 ${confirmPassword && !passwordsMatch ? "border-destructive" : ""}`}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              tabIndex={-1}
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {confirmPassword && !passwordsMatch && (
            <p className="text-xs text-destructive mt-1 animate-in fade-in duration-200">Passwords do not match.</p>
          )}
        </div>

        <div className="pt-2 space-y-3">
          <Button
            type="submit"
            className="w-full h-11 font-semibold bg-primary hover:bg-primary/95 text-white shadow-lg shadow-primary/20 transition-all"
            disabled={isLoading || !allPolicyPassed || !passwordsMatch}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Resetting…
              </span>
            ) : "Reset Password"}
          </Button>
          <Button variant="ghost" className="text-slate-400 hover:text-white border border-slate-700 w-full h-11 transition-all" onClick={() => navigate("/login")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Sign In
          </Button>
        </div>
      </form>
    </div>
  )
}
