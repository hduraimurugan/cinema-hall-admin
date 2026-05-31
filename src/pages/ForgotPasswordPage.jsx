import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { authAPI } from "@/services/api"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Film, Mail, ArrowLeft, CheckCircle, Loader2 } from "lucide-react"

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) {
      setError("Please enter your email address.")
      return
    }
    setError("")
    setIsLoading(true)
    try {
      await authAPI.forgotPassword(email.trim())
      setSubmitted(true)
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.")
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
          {!submitted ? (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white">Forgot your password?</h2>
                <p className="text-slate-400 text-sm mt-1">
                  Enter your account email and we'll send you a reset link.
                </p>
              </div>

              {error && (
                <Alert variant="destructive" className="mb-5 border-destructive/20 bg-destructive/5">
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-300 text-sm font-medium">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                      type="email"
                      placeholder="admin@cinema.com"
                      className="pl-10 h-11 bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-primary"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      autoFocus
                    />
                  </div>
                </div>

                <div className="pt-1 space-y-3">
                  <Button type="submit" className="w-full h-11 font-semibold" disabled={isLoading}>
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Sending…
                      </span>
                    ) : "Send Reset Link"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full h-11 text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500"
                    onClick={() => navigate("/login")}
                    disabled={isLoading}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Sign In
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex flex-col items-center text-center gap-4 py-4">
              <div className="w-14 h-14 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Check your inbox</h2>
              <p className="text-slate-400 text-sm max-w-xs">
                If an account with <strong className="text-slate-300">{email}</strong> exists, a password reset link has been sent.
                The link expires in 15 minutes.
              </p>
              <p className="text-slate-500 text-xs">Didn't receive it? Check your spam folder.</p>
              <Button
                variant="ghost"
                className="text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 w-full"
                onClick={() => navigate("/login")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Sign In
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
