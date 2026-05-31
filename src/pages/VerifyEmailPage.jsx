import { useState, useEffect } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { authAPI } from "@/services/api"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Film, Mail, CheckCircle, XCircle, RefreshCw, Loader2 } from "lucide-react"
import { toast } from "sonner"

export const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get("token")
  const emailParam = searchParams.get("email") // passed from register redirect

  const [status, setStatus] = useState(token ? "verifying" : "pending") // verifying | success | expired | invalid | pending
  const [resendEmail, setResendEmail] = useState(emailParam || "")
  const [resending, setResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  // Auto-verify when token is in URL
  useEffect(() => {
    if (!token) return

    authAPI.verifyEmail(token)
      .then(() => setStatus("success"))
      .catch((err) => {
        const code = err?.data?.code
        if (code === "TOKEN_EXPIRED") setStatus("expired")
        else setStatus("invalid")
      })
  }, [token])

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCooldown])

  const handleResend = async () => {
    if (!resendEmail.trim()) {
      toast.error("Please enter your email address.")
      return
    }
    setResending(true)
    try {
      await authAPI.resendVerification(resendEmail.trim())
      toast.success("Verification email sent! Check your inbox.")
      setResendCooldown(120) // 2 minutes
    } catch (err) {
      toast.error(err.message || "Failed to resend. Please try again.")
    } finally {
      setResending(false)
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

          {/* Verifying state */}
          {status === "verifying" && (
            <div className="flex flex-col items-center text-center gap-4 py-4">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <h2 className="text-xl font-bold text-white">Verifying your email…</h2>
              <p className="text-slate-400 text-sm">Please wait a moment.</p>
            </div>
          )}

          {/* Success */}
          {status === "success" && (
            <div className="flex flex-col items-center text-center gap-4 py-4">
              <div className="w-14 h-14 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Email verified!</h2>
              <p className="text-slate-400 text-sm">Your account is now active. You can sign in to your admin panel.</p>
              <Button className="w-full mt-2" onClick={() => navigate("/login")}>
                Go to Sign In
              </Button>
            </div>
          )}

          {/* Expired */}
          {status === "expired" && (
            <div className="flex flex-col items-center text-center gap-4 py-4">
              <div className="w-14 h-14 rounded-full bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center">
                <XCircle className="w-7 h-7 text-yellow-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Link expired</h2>
              <p className="text-slate-400 text-sm">This verification link has expired (links are valid for 24 hours). Request a new one below.</p>
              <ResendForm
                email={resendEmail}
                setEmail={setResendEmail}
                onResend={handleResend}
                resending={resending}
                cooldown={resendCooldown}
              />
            </div>
          )}

          {/* Invalid */}
          {status === "invalid" && (
            <div className="flex flex-col items-center text-center gap-4 py-4">
              <div className="w-14 h-14 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center">
                <XCircle className="w-7 h-7 text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Invalid link</h2>
              <p className="text-slate-400 text-sm">This verification link is not valid. It may have already been used or the URL may be incomplete.</p>
              <ResendForm
                email={resendEmail}
                setEmail={setResendEmail}
                onResend={handleResend}
                resending={resending}
                cooldown={resendCooldown}
              />
            </div>
          )}

          {/* Pending (no token — landed here from register) */}
          {status === "pending" && (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-14 h-14 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center">
                  <Mail className="w-7 h-7 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-white">Check your inbox</h2>
                <p className="text-slate-400 text-sm">
                  We've sent a verification link to <strong className="text-slate-300">{emailParam || "your email"}</strong>.
                  Click the link to activate your account.
                </p>
                <p className="text-slate-500 text-xs">Didn't receive it? Check your spam folder or request a new link below.</p>
              </div>

              <ResendForm
                email={resendEmail}
                setEmail={setResendEmail}
                onResend={handleResend}
                resending={resending}
                cooldown={resendCooldown}
              />

              <Button variant="ghost" className="text-slate-500 hover:text-slate-300 text-sm" onClick={() => navigate("/login")}>
                Back to Sign In
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const ResendForm = ({ email, setEmail, onResend, resending, cooldown }) => (
  <div className="w-full space-y-3">
    <div className="relative">
      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full pl-10 pr-4 h-11 rounded-md bg-slate-800/60 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-primary"
      />
    </div>
    <Button
      className="w-full"
      onClick={onResend}
      disabled={resending || cooldown > 0}
    >
      {resending ? (
        <span className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Sending…
        </span>
      ) : cooldown > 0 ? (
        <span className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> Resend in {cooldown}s
        </span>
      ) : (
        <span className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> Resend Verification Email
        </span>
      )}
    </Button>
  </div>
)
