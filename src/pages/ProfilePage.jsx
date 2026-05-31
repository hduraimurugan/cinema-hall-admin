import { useState } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useHall } from "../context/HallContext"
import { authAPI } from "@/services/api"
import { PASSWORD_POLICY_CHECKS } from "@/utils/passwordPolicy"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Phone, Building, Shield, Lock, Eye, EyeOff, CheckCircle, LogOut, RefreshCw, Loader2 } from "lucide-react"
import { toast } from "sonner"

export const ProfilePage = () => {
  const { user, cinemaHall, changePassword, logoutAllDevices } = useAuth()
  const { activeHall } = useHall()

  // Change password form state
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  // Logout all devices state
  const [loggingOutAll, setLoggingOutAll] = useState(false)

  // Resend verification
  const [resendingVerification, setResendingVerification] = useState(false)

  const allPolicyPassed = PASSWORD_POLICY_CHECKS.every((c) => c.test(newPassword))
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (!allPolicyPassed) { toast.error("New password does not meet the policy."); return }
    if (!passwordsMatch) { toast.error("Passwords do not match."); return }
    if (newPassword === currentPassword) { toast.error("New password must be different from current password."); return }

    setChangingPassword(true)
    try {
      const result = await changePassword(currentPassword, newPassword)
      if (result.success) {
        toast.success("Password changed successfully.")
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      } else {
        toast.error(result.message || "Failed to change password.")
      }
    } finally {
      setChangingPassword(false)
    }
  }

  const handleLogoutAllDevices = async () => {
    setLoggingOutAll(true)
    try {
      const result = await logoutAllDevices()
      if (result.success) {
        toast.success("Signed out from all devices.")
      } else {
        toast.error(result.message || "Failed to sign out from all devices.")
      }
    } finally {
      setLoggingOutAll(false)
    }
  }

  const handleResendVerification = async () => {
    if (!user?.email) return
    setResendingVerification(true)
    try {
      await authAPI.resendVerification(user.email)
      toast.success("Verification email sent!")
    } catch (err) {
      toast.error(err.message || "Failed to send verification email.")
    } finally {
      setResendingVerification(false)
    }
  }

  const lastLoginFormatted = user?.last_login_at
    ? new Date(user.last_login_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    : null
  const passwordChangedFormatted = user?.password_changed_at
    ? new Date(user.password_changed_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    : null

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-8">

      {/* Admin Profile */}
      <section>
        <h2 className="text-xl font-semibold text-foreground mb-1">Admin Profile</h2>
        <p className="text-sm text-muted-foreground mb-5">Your account information</p>

        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{user?.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="text-foreground">{user?.email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="text-foreground">{user?.phone || "—"}</span>
            </div>
          </div>
        </div>
      </section>

      <Separator />

      {/* Cinema Hall */}
      <section>
        <h2 className="text-xl font-semibold text-foreground mb-1">Cinema Hall</h2>
        <p className="text-sm text-muted-foreground mb-5">
          Manage your halls from the dedicated halls page
        </p>
        <div className="bg-card border border-border rounded-xl p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
              <Building className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-foreground truncate">
                {activeHall?.name ?? cinemaHall?.name ?? "No hall yet"}
              </p>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {activeHall?.location ?? cinemaHall?.location ?? "—"}
                {(activeHall?.district || cinemaHall?.district) &&
                  ` · ${activeHall?.district ?? cinemaHall?.district}`}
              </p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <Link to="/halls">Manage Halls →</Link>
          </Button>
        </div>
      </section>

      <Separator />

      {/* Security */}
      <section>
        <h2 className="text-xl font-semibold text-foreground mb-1 flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" /> Security
        </h2>
        <p className="text-sm text-muted-foreground mb-5">Manage your account security settings</p>

        <div className="space-y-4">
          {/* Email verification status */}
          <div className="bg-card border border-border rounded-xl p-5 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <Mail className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Email Verification</p>
                {user?.email_verified ? (
                  <p className="text-xs text-muted-foreground mt-0.5">Verified</p>
                ) : (
                  <p className="text-xs text-yellow-500 mt-0.5">Not verified — please check your inbox</p>
                )}
              </div>
            </div>
            {user?.email_verified ? (
              <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20 shrink-0">Verified</Badge>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 text-xs h-8"
                onClick={handleResendVerification}
                disabled={resendingVerification}
              >
                {resendingVerification ? (
                  <span className="flex items-center gap-1.5"><Loader2 className="w-3 h-3 animate-spin" /> Sending…</span>
                ) : (
                  <span className="flex items-center gap-1.5"><RefreshCw className="w-3 h-3" /> Resend</span>
                )}
              </Button>
            )}
          </div>

          {/* Security metadata */}
          {(lastLoginFormatted || passwordChangedFormatted) && (
            <div className="bg-card border border-border rounded-xl p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {lastLoginFormatted && (
                <div>
                  <p className="text-xs text-muted-foreground">Last sign in</p>
                  <p className="text-sm text-foreground mt-0.5">{lastLoginFormatted}</p>
                </div>
              )}
              {passwordChangedFormatted && (
                <div>
                  <p className="text-xs text-muted-foreground">Password last changed</p>
                  <p className="text-sm text-foreground mt-0.5">{passwordChangedFormatted}</p>
                </div>
              )}
            </div>
          )}

          {/* Change password */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary" />
              <p className="text-sm font-medium text-foreground">Change Password</p>
            </div>
            <Separator />
            <form onSubmit={handleChangePassword} className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Current Password</Label>
                <div className="relative">
                  <Input
                    type={showCurrent ? "text" : "password"}
                    placeholder="Current password"
                    className="pr-10 h-10 text-sm"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    disabled={changingPassword}
                  />
                  <button type="button" onClick={() => setShowCurrent(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">New Password</Label>
                <div className="relative">
                  <Input
                    type={showNew ? "text" : "password"}
                    placeholder="New password"
                    className="pr-10 h-10 text-sm"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={changingPassword}
                  />
                  <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {newPassword.length > 0 && (
                  <ul className="space-y-0.5 pt-1">
                    {PASSWORD_POLICY_CHECKS.map((check) => {
                      const passed = check.test(newPassword)
                      return (
                        <li key={check.label} className={`flex items-center gap-2 text-xs ${passed ? "text-green-500" : "text-muted-foreground"}`}>
                          <CheckCircle className={`w-3 h-3 flex-shrink-0 ${passed ? "text-green-500" : "text-muted-foreground/40"}`} />
                          {check.label}
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Confirm New Password</Label>
                <Input
                  type="password"
                  placeholder="Confirm new password"
                  className={`h-10 text-sm ${confirmPassword && !passwordsMatch ? "border-destructive" : ""}`}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={changingPassword}
                />
                {confirmPassword && !passwordsMatch && (
                  <p className="text-xs text-destructive">Passwords do not match.</p>
                )}
              </div>

              <Button
                type="submit"
                size="sm"
                className="w-full"
                disabled={changingPassword || !currentPassword || !allPolicyPassed || !passwordsMatch}
              >
                {changingPassword ? (
                  <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Changing…</span>
                ) : "Change Password"}
              </Button>
            </form>
          </div>

          {/* Logout all devices */}
          <div className="bg-card border border-border rounded-xl p-5 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <LogOut className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Sign Out All Devices</p>
                <p className="text-xs text-muted-foreground mt-0.5">Revokes all active sessions across all devices.</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 text-xs h-8 border-destructive/30 text-destructive hover:bg-destructive/10"
              onClick={handleLogoutAllDevices}
              disabled={loggingOutAll}
            >
              {loggingOutAll ? (
                <span className="flex items-center gap-1.5"><Loader2 className="w-3 h-3 animate-spin" /> Signing out…</span>
              ) : "Sign Out All"}
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
