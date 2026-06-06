import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Search, Users, RefreshCw, CheckCircle2, X, Phone, MapPin, CalendarDays,
  Clock, KeyRound, Lock, ShieldCheck, Mail, Loader2, ChevronRight, Ticket,
} from "lucide-react"
import { customersAPI } from "../services/api"
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

// ── Customer Detail Sheet ────────────────────────────────────────────────────────────────────────────
function CustomerDetailSheet({ customer, onClose }) {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!customer) return
    setLoading(true); setError(null); setDetail(null)
    customersAPI.getDetails(customer.id)
      .then(setDetail)
      .catch(() => setError("Failed to load customer details."))
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer?.id])

  const c = detail?.customer || customer
  const bookings = detail?.recentBookings || []
  const sessions = detail?.activeSessions || []

  return (
    <Sheet open={!!customer} onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col gap-0 p-0 overflow-hidden">
        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/50 shrink-0">
          <div className="flex items-start gap-4">
            {c?.avatar ? (
              <img src={c.avatar} alt="" className="w-12 h-12 rounded-full object-cover shrink-0" />
            ) : (
              <div className={`w-12 h-12 rounded-full ${avatarColor(c?.name || "")} flex items-center justify-center text-white font-bold text-base shrink-0`}>
                {getInitials(c?.name)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-base font-semibold leading-tight truncate">{c?.name}</SheetTitle>
              <p className="text-sm text-muted-foreground truncate mt-0.5">{c?.email}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {c?.is_verified ? (
                  <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/25 text-[11px] px-2 py-0.5 gap-1">
                    <ShieldCheck className="w-3 h-3" /> Verified
                  </Badge>
                ) : (
                  <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/25 text-[11px] px-2 py-0.5 gap-1">
                    <Mail className="w-3 h-3" /> Unverified
                  </Badge>
                )}
                {c?.auth_providers?.length > 0 && c.auth_providers.map(p => (
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
                  { icon: Phone,        label: "Phone",            value: c?.phone || "—" },
                  { icon: MapPin,       label: "Location",         value: [c?.district, c?.state].filter(Boolean).join(", ") || "—" },
                  { icon: CalendarDays, label: "Registered",       value: fmtDate(c?.created_at) },
                  { icon: Clock,        label: "Last Login",       value: fmtDateTime(c?.last_login_at) },
                  { icon: KeyRound,     label: "Password Changed", value: fmtDateTime(c?.password_changed_at) },
                  { icon: Lock,         label: "Locked Until",     value: c?.account_locked_until && new Date(c.account_locked_until) > new Date() ? fmtDateTime(c.account_locked_until) : "—" },
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
                {(c?.auth_providers || ['local']).map(provider => (
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
                {c?.has_password === false && (
                  <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2">
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-xs font-medium text-amber-400">No password set</span>
                  </div>
                )}
              </div>
            </section>

            {/* Recent Bookings */}
            <section>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Recent Bookings <span className="normal-case font-normal">({bookings.length})</span>
              </p>
              {bookings.length === 0 ? (
                <div className="rounded-lg bg-muted/30 border border-dashed border-border/40 p-4 text-center text-xs text-muted-foreground">
                  No bookings yet
                </div>
              ) : (
                <div className="space-y-2">
                  {bookings.map((b) => (
                    <div key={b.id} className="flex items-center gap-3 rounded-lg border border-border/40 bg-muted/40 px-3 py-2.5">
                      <div className="shrink-0">
                        <Ticket className={`w-3.5 h-3.5 ${b.payment_status === 'completed' ? 'text-emerald-400' : b.payment_status === 'failed' ? 'text-red-400' : 'text-amber-400'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 capitalize ${b.booking_status === 'confirmed' ? 'border-emerald-500/30 text-emerald-400' : b.booking_status === 'cancelled' ? 'border-red-500/30 text-red-400' : 'border-amber-500/30 text-amber-400'}`}>
                            {b.booking_status}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">{fmtDateTime(b.created_at)}</span>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-foreground shrink-0">₹{Number(b.total_amount).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Active Sessions */}
            <section>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Active Sessions <span className="normal-case font-normal">({sessions.length})</span>
              </p>
              {sessions.length === 0 ? (
                <div className="rounded-lg bg-muted/30 border border-dashed border-border/40 p-4 text-center text-xs text-muted-foreground">
                  No active sessions
                </div>
              ) : (
                <div className="space-y-2">
                  {sessions.map((s) => (
                    <div key={s.id} className="rounded-lg border border-border/40 bg-muted/40 px-3 py-2.5">
                      <p className="text-xs text-foreground font-mono truncate">{s.user_agent ? s.user_agent.slice(0, 60) : '—'}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] text-muted-foreground font-mono">{s.ip_address || '—'}</span>
                        <span className="text-[10px] text-muted-foreground">Last used: {fmtDateTime(s.last_used_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

const UsersPage = () => {
  const [customers, setCustomers] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState(null)
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState(null)

  const totalPages = Math.max(1, Math.ceil(total / limit))

  const fetchCustomers = useCallback((filters) => {
    setLoading(true)
    setError(null)
    customersAPI.getAll(filters)
      .then(data => {
        setCustomers(data.customers || [])
        setTotal(data.total || 0)
        setStats(data.stats || null)
      })
      .catch(err => setError(err?.error || err?.message || "Failed to load customers"))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchCustomers({ search, page, limit })
  }, [search, page, limit, fetchCustomers])

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

  return (
    <div className="p-6 space-y-6">
      {selectedCustomer && (
        <CustomerDetailSheet customer={selectedCustomer} onClose={() => setSelectedCustomer(null)} />
      )}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
            <p className="text-sm text-muted-foreground">All registered platform customers</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {total > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-primary inline-block" />
              {total} customer{total !== 1 ? "s" : ""}
            </div>
          )}
          <ExportButton
            filename="customers"
            disabled={loading}
            data={customers.map(c => ({
              "Name": c.name || "",
              "Email": c.email || "",
              "Phone": c.phone || "",
              "Location": [c.district, c.state].filter(Boolean).join(", "),
              "Verified": c.is_verified ? "Yes" : "No",
              "Joined": c.created_at ? new Date(c.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" }) : "",
              "Bookings": c.booking_count || 0,
            }))}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchCustomers({ search, page, limit })}
            disabled={loading}
            className="h-8 gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Customers</p>
              <div className="p-1.5 rounded-md bg-primary/10">
                <Users className="w-3.5 h-3.5 text-primary" />
              </div>
            </div>
            {loading && !stats ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <p className="text-2xl font-bold">{(stats?.total ?? 0).toLocaleString("en-IN")}</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Verified</p>
              <div className="p-1.5 rounded-md bg-emerald-500/10">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              </div>
            </div>
            {loading && !stats ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <p className="text-2xl font-bold">{(stats?.verified ?? 0).toLocaleString("en-IN")}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="border-border/60">
        <CardContent className="px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Search by name, email or phone..."
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
            <CardTitle className="text-base font-semibold">All Customers</CardTitle>
            {!loading && customers.length > 0 && (
              <span className="text-xs text-muted-foreground">
                Showing {customers.length} of {total}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-3 px-5">
          {error ? (
            <div className="flex flex-col items-center py-16 text-destructive gap-2">
              <Users className="w-10 h-10 opacity-40" />
              <p className="text-sm">{error}</p>
            </div>
          ) : loading ? (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/50">
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Customer</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Phone</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Location</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Joined</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Bookings</TableHead>
                  <TableHead />
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
                    <TableCell><Skeleton className="h-3.5 w-32 rounded" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-3.5 w-20 rounded" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-8 rounded-md" /></TableCell>
                    <TableCell />
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : customers.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-muted-foreground gap-3">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <Users className="w-8 h-8 opacity-40" />
              </div>
              <div className="text-center">
                <p className="font-medium text-foreground">No customers found</p>
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
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Customer</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Phone</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Location</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Joined</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Bookings</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((c) => (
                  <TableRow
                    key={c.id}
                    className="border-border/40 hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => setSelectedCustomer(c)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        {c.avatar ? (
                          <img src={c.avatar} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className={`w-8 h-8 rounded-full ${avatarColor(c.name || "")} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                            {getInitials(c.name)}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-sm leading-tight">{c.name || "—"}</p>
                          <p className="text-xs text-muted-foreground leading-tight">{c.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{c.phone || "—"}</span>
                    </TableCell>
                    <TableCell>
                      {c.district || c.state ? (
                        <span className="text-sm">{[c.district, c.state].filter(Boolean).join(", ")}</span>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {c.is_verified ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                            <CheckCircle2 className="w-3 h-3" /> Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/25">
                            Unverified
                          </span>
                        )}
                        {c.auth_providers?.filter(p => p !== 'local').map(p => (
                          <span key={p} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-muted border border-border/60 capitalize">
                            {p === 'google' && <svg className="w-2.5 h-2.5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/></svg>}
                            {p === 'github' && <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>}
                            {p}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {new Date(c.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
                        {c.booking_count}
                      </span>
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

export default UsersPage
