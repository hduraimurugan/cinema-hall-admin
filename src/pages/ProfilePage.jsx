import { useState } from "react"
import { Link } from "react-router-dom"
import { useGoogleLogin } from "@react-oauth/google"
import { useAuth } from "../context/AuthContext"
import { useHall } from "../context/HallContext"
import { authAPI } from "@/services/api"
import { PASSWORD_POLICY_CHECKS } from "@/utils/passwordPolicy"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Phone, Building, Shield, Lock, Eye, EyeOff, CheckCircle, LogOut, RefreshCw, Loader2, Link2, Unlink } from "lucide-react"
import { toast } from "sonner"

export const ProfilePage = () => {
  const { user, cinemaHall, changePassword, logoutAllDevices, refreshUser } = useAuth()
  const { activeHall } = useHall()

  // Change password form state
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  // Set password (for OAuth-only accounts)
  const [setPasswordValue, setSetPasswordValue] = useState("")
  const [confirmSetPassword, setConfirmSetPassword] = useState("")
  const [settingPassword, setSettingPassword] = useState(false)

  // Logout all devices state
  const [loggingOutAll, setLoggingOutAll] = useState(false)

  // Resend verification
  const [resendingVerification, setResendingVerification] = useState(false)

  // OAuth provider linking
  const [linkingProvider, setLinkingProvider] = useState(null)
  const [unlinkingProvider, setUnlinkingProvider] = useState(null)

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

  // Google link handler
  const handleLinkGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLinkingProvider('google')
      try {
        await authAPI.linkProvider('google', { idToken: tokenResponse.access_token })
        toast.success("Google account linked successfully!")
        refreshUser()
      } catch (err) {
        toast.error(err.message || "Failed to link Google account.")
      } finally {
        setLinkingProvider(null)
      }
    },
    onError: () => {
      toast.error("Google linking was cancelled.")
      setLinkingProvider(null)
    },
  })

  const handleUnlinkProvider = async (provider) => {
    setUnlinkingProvider(provider)
    try {
      await authAPI.unlinkProvider(provider)
      toast.success(`${provider.charAt(0).toUpperCase() + provider.slice(1)} account unlinked.`)
      refreshUser()
    } catch (err) {
      toast.error(err.message || `Failed to unlink ${provider}.`)
    } finally {
      setUnlinkingProvider(null)
    }
  }

  const handleLinkGithub = () => {
    setLinkingProvider('github')
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID
    const redirectUri = `${window.location.origin}/auth/github/callback`
    const scope = 'user:email'
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`
  }

  const handleSetPassword = async (e) => {
    e.preventDefault()
    const allPassed = PASSWORD_POLICY_CHECKS.every((c) => c.test(setPasswordValue))
    if (!allPassed) { toast.error("Password does not meet the policy."); return }
    if (setPasswordValue !== confirmSetPassword) { toast.error("Passwords do not match."); return }

    setSettingPassword(true)
    try {
      await authAPI.setPassword(setPasswordValue)
      toast.success("Password set successfully!")
      setSetPasswordValue("")
      setConfirmSetPassword("")
      refreshUser()
    } catch (err) {
      toast.error(err.message || "Failed to set password.")
    } finally {
      setSettingPassword(false)
    }
  }

  const authProviders = user?.auth_providers || ['local']
  const hasPassword = user?.has_password !== false

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
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover border border-border" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-primary" />
              </div>
            )}
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

          {/* Connected Login Methods */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-primary" />
              <p className="text-sm font-medium text-foreground">Connected Login Methods</p>
            </div>
            <Separator />
            <div className="space-y-3">
              {/* Email & Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Email & Password</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </div>
                {hasPassword ? (
                  <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20">Connected</Badge>
                ) : (
                  <Badge variant="secondary" className="bg-muted text-muted-foreground">Not set</Badge>
                )}
              </div>

              {/* Google */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Google</p>
                    <p className="text-xs text-muted-foreground">{authProviders.includes('google') ? 'Linked' : 'Not linked'}</p>
                  </div>
                </div>
                {authProviders.includes('google') ? (
                  <Button
                    variant="outline" size="sm" className="text-xs h-8 border-destructive/30 text-destructive hover:bg-destructive/10"
                    onClick={() => handleUnlinkProvider('google')}
                    disabled={unlinkingProvider === 'google'}
                  >
                    {unlinkingProvider === 'google' ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Unlink className="w-3 h-3 mr-1" />}
                    Disconnect
                  </Button>
                ) : (
                  <Button
                    variant="outline" size="sm" className="text-xs h-8"
                    onClick={() => handleLinkGoogle()}
                    disabled={linkingProvider === 'google'}
                  >
                    {linkingProvider === 'google' ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Link2 className="w-3 h-3 mr-1" />}
                    Connect
                  </Button>
                )}
              </div>

              {/* GitHub */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">GitHub</p>
                    <p className="text-xs text-muted-foreground">{authProviders.includes('github') ? 'Linked' : 'Not linked'}</p>
                  </div>
                </div>
                {authProviders.includes('github') ? (
                  <Button
                    variant="outline" size="sm" className="text-xs h-8 border-destructive/30 text-destructive hover:bg-destructive/10"
                    onClick={() => handleUnlinkProvider('github')}
                    disabled={unlinkingProvider === 'github'}
                  >
                    {unlinkingProvider === 'github' ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Unlink className="w-3 h-3 mr-1" />}
                    Disconnect
                  </Button>
                ) : (
                  <Button
                    variant="outline" size="sm" className="text-xs h-8"
                    onClick={handleLinkGithub}
                    disabled={linkingProvider === 'github'}
                  >
                    {linkingProvider === 'github' ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Link2 className="w-3 h-3 mr-1" />}
                    Connect
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Change password / Set password */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary" />
              <p className="text-sm font-medium text-foreground">{hasPassword ? 'Change Password' : 'Set Password'}</p>
            </div>
            <Separator />
            {hasPassword ? (
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
            ) : (
            <form onSubmit={handleSetPassword} className="space-y-3">
              <p className="text-xs text-muted-foreground">You signed up via OAuth. Set a password to also login with email and password.</p>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">New Password</Label>
                <Input
                  type="password"
                  placeholder="New password"
                  className="h-10 text-sm"
                  value={setPasswordValue}
                  onChange={(e) => setSetPasswordValue(e.target.value)}
                  disabled={settingPassword}
                />
                {setPasswordValue.length > 0 && (
                  <ul className="space-y-0.5 pt-1">
                    {PASSWORD_POLICY_CHECKS.map((check) => {
                      const passed = check.test(setPasswordValue)
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
                <Label className="text-xs text-muted-foreground">Confirm Password</Label>
                <Input
                  type="password"
                  placeholder="Confirm password"
                  className={`h-10 text-sm ${confirmSetPassword && setPasswordValue !== confirmSetPassword ? "border-destructive" : ""}`}
                  value={confirmSetPassword}
                  onChange={(e) => setConfirmSetPassword(e.target.value)}
                  disabled={settingPassword}
                />
                {confirmSetPassword && setPasswordValue !== confirmSetPassword && (
                  <p className="text-xs text-destructive">Passwords do not match.</p>
                )}
              </div>
              <Button
                type="submit"
                size="sm"
                className="w-full"
                disabled={settingPassword || !PASSWORD_POLICY_CHECKS.every(c => c.test(setPasswordValue)) || setPasswordValue !== confirmSetPassword}
              >
                {settingPassword ? (
                  <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Setting…</span>
                ) : "Set Password"}
              </Button>
            </form>
            )}
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
