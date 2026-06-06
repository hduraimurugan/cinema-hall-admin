import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Search, Building2, RefreshCw, X, MapPin, ShieldCheck, ShieldAlert,
  LogIn, Mail, KeyRound, Lock, UserCheck, Clock, ChevronRight, Loader2,
  Phone, CalendarDays, ShieldOff,
} from "lucide-react"
import { adminsAPI } from "../services/api"
import { Pagination } from "@/components/ui/Pagination"
import { ExportButton } from "@/components/ExportButton"

function debounce(fn, delay) {
  let t
  return (...args) => {
    clearTimeout(t)
    t = setTimeout(() => fn(...args), delay)
  }
}

function getInitials(name = "") {
  return name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase() || "?"
}

const avatarColors = [
  "bg-violet-500", "bg-sky-500", "bg-rose-500",
  "bg-amber-500", "bg-teal-500", "bg-pink-500",
]
function avatarColor(name = "") {
  const code = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return avatarColors[code % avatarColors.length]
}

function fmtDate(val) {
  if (!val) return "—"
  return new Date(val).toLocaleDateString("en-IN", { dateStyle: "medium" })
}
function fmtDateTime(val) {
  if (!val) return "—"
  return new Date(val).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
}

// ── Log action meta ────────────────────────────────────────────────────────────────────────────────
const LOG_META = {
  LOGIN_SUCCESS:               { icon: LogIn,       color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", label: "Login success" },
  LOGIN_FAILED_WRONG_PASSWORD: { icon: ShieldAlert,  color: "text-red-400",     bg: "bg-red-500/10 border-red-500/20",         label: "Wrong password" },
  LOGIN_FAILED_UNKNOWN_EMAIL:  { icon: ShieldAlert,  color: "text-red-400",     bg: "bg-red-500/10 border-red-500/20",         label: "Unknown email" },
  LOGIN_FAILED_UNVERIFIED:     { icon: Mail,         color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/20",     label: "Login — unverified" },
  LOGIN_ATTEMPT_WHILE_LOCKED:  { icon: Lock,         color: "text-red-400",     bg: "bg-red-500/10 border-red-500/20",         label: "Login while locked" },
  EMAIL_VERIFIED:              { icon: ShieldCheck,  color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", label: "Email verified" },
  REGISTER:                    { icon: UserCheck,    color: "text-sky-400",     bg: "bg-sky-500/10 border-sky-500/20",         label: "Registered" },
  REGISTER_GOOGLE:             { icon: UserCheck,    color: "text-sky-400",     bg: "bg-sky-500/10 border-sky-500/20",         label: "Registered via Google" },
  REGISTER_GITHUB:             { icon: UserCheck,    color: "text-sky-400",     bg: "bg-sky-500/10 border-sky-500/20",         label: "Registered via GitHub" },
  LOGIN_GOOGLE:                { icon: LogIn,        color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", label: "Login via Google" },
  LOGIN_GITHUB:                { icon: LogIn,        color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", label: "Login via GitHub" },
  PROVIDER_LINKED:             { icon: ShieldCheck,  color: "text-sky-400",     bg: "bg-sky-500/10 border-sky-500/20",         label: "Provider linked" },
  PROVIDER_UNLINKED:           { icon: ShieldOff,    color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/20",     label: "Provider unlinked" },
  RESEND_VERIFICATION:         { icon: Mail,         color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/20",     label: "Resent verification" },
  PASSWORD_RESET_REQUESTED:    { icon: KeyRound,     color: "text-violet-400",  bg: "bg-violet-500/10 border-violet-500/20",   label: "Reset requested" },
  PASSWORD_RESET_SUCCESS:      { icon: KeyRound,     color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", label: "Password reset" },
  PASSWORD_CHANGED:            { icon: KeyRound,     color: "text-sky-400",     bg: "bg-sky-500/10 border-sky-500/20",         label: "Password changed" },
  PASSWORD_SET:                { icon: KeyRound,     color: "text-sky-400",     bg: "bg-sky-500/10 border-sky-500/20",         label: "Password set" },
  ACCOUNT_LOCKED:              { icon: Lock,         color: "text-red-400",     bg: "bg-red-500/10 border-red-500/20",         label: "Account locked" },
  LOGOUT:                      { icon: LogIn,        color: "text-slate-400",   bg: "bg-slate-500/10 border-slate-500/20",     label: "Logout" },
  LOGOUT_ALL_DEVICES:          { icon: LogIn,        color: "text-slate-400",   bg: "bg-slate-500/10 border-slate-500/20",     label: "Logout all devices" },
}
function logMeta(action) {
  return LOG_META[action] || { icon: ShieldOff, color: "text-slate-400", bg: "bg-slate-500/10 border-slate-500/20", label: action }
}

// ── Admin Detail Sheet ────────────────────────────────────────────────────────────────────────────────
function AdminDetailSheet({ admin, onClose }) {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!admin) return
    setLoading(true); setError(null); setDetail(null)
    adminsAPI.getLogs(admin.id)
      .then(setDetail)
      .catch(() => setError("Failed to load security details."))
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin?.id])

  const a = detail?.admin || admin
  const logs = detail?.logs || []

  return (
    <Sheet open={!!admin} onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col gap-0 p-0 overflow-hidden">
        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/50 shrink-0">
          <div className="flex items-start gap-4">
            {a?.avatar ? (
              <img src={a.avatar} alt="" className="w-12 h-12 rounded-full object-cover shrink-0" />
            ) : (
              <div className={`w-12 h-12 rounded-full ${avatarColor(a?.name || "")} flex items-center justify-center text-white font-bold text-base shrink-0`}>
                {getInitials(a?.name)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-base font-semibold leading-tight truncate">{a?.name}</SheetTitle>
              <p className="text-sm text-muted-foreground truncate mt-0.5">{a?.email}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {a?.email_verified ? (
                  <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/25 text-[11px] px-2 py-0.5 gap-1">
                    <ShieldCheck className="w-3 h-3" /> Verified
                  </Badge>
                ) : (
                  <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/25 text-[11px] px-2 py-0.5 gap-1">
                    <Mail className="w-3 h-3" /> Unverified
                  </Badge>
                )}
                <Badge variant="outline" className="text-[11px] px-2 py-0.5 capitalize">{a?.role}</Badge>
                {a?.auth_providers?.length > 0 && a.auth_providers.map(p => (
                  <Badge key={p} variant="outline" className="text-[10px] px-1.5 py-0.5 gap-1 capitalize">
                    {p === 'google' && <svg className="w-2.5 h-2.5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/></svg>}
                    {p === 'github' && <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>}
                    {p}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </SheetHeader>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center py-16 text-destructive text-sm">{error}</div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

            {/* Details grid */}
            <section>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Account Details</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Phone,        label: "Phone",            value: a?.phone || "—" },
                  { icon: CalendarDays, label: "Registered",       value: fmtDate(a?.created_at) },
                  { icon: ShieldCheck,  label: "Email Verified",   value: a?.email_verified ? (fmtDateTime(a?.email_verified_at) || "Yes") : "No" },
                  { icon: Clock,        label: "Last Login",        value: fmtDateTime(a?.last_login_at) },
                  { icon: KeyRound,     label: "Password Changed",  value: fmtDateTime(a?.password_changed_at) },
                  { icon: Lock,         label: "Locked Until",      value: a?.account_locked_until && new Date(a.account_locked_until) > new Date() ? fmtDateTime(a.account_locked_until) : "—" },
                // eslint-disable-next-line no-unused-vars
                ].map(({ icon: ItemIcon, label, value }) => (
                  <div key={label} className="rounded-lg bg-muted/40 border border-border/40 p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <ItemIcon className="w-3 h-3 text-muted-foreground" />
                      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
                    </div>
                    <p className="text-xs font-medium text-foreground leading-snug">{value}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Auth Providers */}
            <section>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Login Methods</p>
              <div className="flex flex-wrap gap-2">
                {(a?.auth_providers || ['local']).map(provider => (
                  <div key={provider} className="flex items-center gap-2 rounded-lg bg-muted/40 border border-border/40 px-3 py-2">
                    {provider === 'local' && <KeyRound className="w-3.5 h-3.5 text-muted-foreground" />}
                    {provider === 'google' && (
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    )}
                    {provider === 'github' && (
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                      </svg>
                    )}
                    <span className="text-xs font-medium capitalize">{provider === 'local' ? 'Email/Password' : provider}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Cinema Hall */}
            <section>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Cinema Hall</p>
              {a?.hall_name ? (
                <div className="rounded-lg bg-muted/40 border border-border/40 p-3 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="text-sm font-medium">{a.hall_name}</span>
                  </div>
                  {(a.location || a.district || a.state) && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                      <span className="text-xs text-muted-foreground">{[a.location, a.district, a.state].filter(Boolean).join(", ")}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-lg bg-muted/30 border border-dashed border-border/40 p-3 text-center text-xs text-muted-foreground">
                  No cinema hall assigned
                </div>
              )}
            </section>

            {/* Security Logs */}
            <section>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Security Activity <span className="normal-case font-normal">(last {logs.length})</span>
              </p>
              {logs.length === 0 ? (
                <div className="rounded-lg bg-muted/30 border border-dashed border-border/40 p-4 text-center text-xs text-muted-foreground">
                  No activity recorded yet
                </div>
              ) : (
                <div className="space-y-2">
                  {logs.map((log, i) => {
                    const { icon: Icon, color, bg, label } = logMeta(log.action)
                    return (
                      <div key={i} className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 ${bg}`}>
                        <div className={`mt-0.5 shrink-0 ${color}`}><Icon className="w-3.5 h-3.5" /></div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-medium ${color}`}>{label}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-[10px] text-muted-foreground">{fmtDateTime(log.created_at)}</span>
                            {log.ip_address && <span className="text-[10px] text-muted-foreground font-mono">{log.ip_address}</span>}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>

          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

const AdminsPage = () => {
  const [admins, setAdmins] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [selectedAdmin, setSelectedAdmin] = useState(null)

  const totalPages = Math.max(1, Math.ceil(total / limit))

  const fetchAdmins = useCallback((filters) => {
    setLoading(true)
    setError(null)
    adminsAPI.getAll(filters)
      .then(data => {
        setAdmins(data.admins || [])
        setTotal(data.total || 0)
      })
      .catch(err => setError(err?.error || err?.message || "Failed to load admins"))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchAdmins({ search, page, limit })
  }, [search, page, limit, fetchAdmins])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce((val) => { setSearch(val); setPage(1) }, 400),
    []
  )

  const handleSearchChange = (e) => {
    setSearchInput(e.target.value)
    debouncedSearch(e.target.value)
  }

  const handleClear = () => {
    setSearch(""); setSearchInput(""); setPage(1)
  }

  const COLS = ["Admin", "Phone", "Verified", "Cinema Hall", "Location", "Registered", ""]

  return (
    <div className="p-6 space-y-6">
      {selectedAdmin && (
        <AdminDetailSheet admin={selectedAdmin} onClose={() => setSelectedAdmin(null)} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Cinema Hall Admins</h1>
            <p className="text-sm text-muted-foreground">All registered cinema hall admins</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {total > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-primary inline-block" />
              {total} admin{total !== 1 ? "s" : ""}
            </div>
          )}
          <ExportButton
            filename="hall-admins"
            disabled={loading}
            data={admins.map(a => ({
              "Name": a.name || "",
              "Email": a.email || "",
              "Phone": a.phone || "",
              "Email Verified": a.email_verified ? "Yes" : "No",
              "Verified At": fmtDateTime(a.email_verified_at),
              "Last Login": fmtDateTime(a.last_login_at),
              "Cinema Hall": a.hall_name || "",
              "Location": [a.location, a.district, a.state].filter(Boolean).join(", "),
              "Registered": fmtDate(a.created_at),
            }))}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAdmins({ search, page, limit })}
            disabled={loading}
            className="h-8 gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card className="border-border/60">
        <CardContent className="px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Search by name, email or hall name..."
                value={searchInput}
                onChange={handleSearchChange}
                className="pl-8 h-9 text-sm"
              />
            </div>
            {searchInput && (
              <Button variant="ghost" size="sm" onClick={handleClear} className="h-9 gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                <X className="w-3 h-3" /> Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-border/60">
        <CardHeader className="pb-0 pt-4 px-5">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">All Cinema Hall Admins</CardTitle>
            {!loading && admins.length > 0 && (
              <span className="text-xs text-muted-foreground">
                Showing {admins.length} of {total}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-3 px-5">
          {error ? (
            <div className="flex flex-col items-center py-16 text-destructive gap-2">
              <Building2 className="w-10 h-10 opacity-40" />
              <p className="text-sm">{error}</p>
            </div>
          ) : loading ? (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/50">
                  {COLS.map(c => <TableHead key={c} className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{c}</TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i} className="border-border/40">
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                        <div className="space-y-1.5">
                          <Skeleton className="h-3.5 w-28 rounded" />
                          <Skeleton className="h-3 w-36 rounded" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-3.5 w-24 rounded" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Skeleton className="w-3.5 h-3.5 rounded shrink-0" />
                        <Skeleton className="h-3.5 w-28 rounded" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Skeleton className="w-3 h-3 rounded shrink-0" />
                        <Skeleton className="h-3.5 w-36 rounded" />
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-3.5 w-20 rounded" /></TableCell>
                    <TableCell />
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : admins.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-muted-foreground gap-3">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <Building2 className="w-8 h-8 opacity-40" />
              </div>
              <div className="text-center">
                <p className="font-medium text-foreground">No admins found</p>
                {search && <p className="text-sm mt-1">Try a different search term</p>}
              </div>
              {search && (
                <Button variant="outline" size="sm" onClick={handleClear}>Clear search</Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/50">
                  {COLS.map(c => <TableHead key={c} className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{c}</TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((a) => (
                  <TableRow
                    key={a.id}
                    className="border-border/40 hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => setSelectedAdmin(a)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full ${avatarColor(a.name || "")} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                          {getInitials(a.name)}
                        </div>
                        <div>
                          <p className="font-medium text-sm leading-tight">{a.name || "—"}</p>
                          <p className="text-xs text-muted-foreground leading-tight">{a.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{a.phone || "—"}</span>
                    </TableCell>
                    <TableCell>
                      {a.email_verified ? (
                        <div>
                          <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/25 text-[11px] px-2 py-0.5 gap-1">
                            <ShieldCheck className="w-3 h-3" /> Verified
                          </Badge>
                          {a.email_verified_at && (
                            <p className="text-[10px] text-muted-foreground mt-1">{fmtDate(a.email_verified_at)}</p>
                          )}
                        </div>
                      ) : (
                        <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/25 text-[11px] px-2 py-0.5 gap-1">
                          <Mail className="w-3 h-3" /> Unverified
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {a.hall_name ? (
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span className="text-sm font-medium">{a.hall_name}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">No hall</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {a.location ? (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                          <span className="text-sm">{[a.location, a.district, a.state].filter(Boolean).join(", ")}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <span className="text-sm text-muted-foreground">{fmtDate(a.created_at)}</span>
                        {a.last_login_at && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            Last login {fmtDate(a.last_login_at)}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {!loading && total > 0 && (
            <Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={setPage} onLimitChange={(v) => { setLimit(v); setPage(1) }} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default AdminsPage
