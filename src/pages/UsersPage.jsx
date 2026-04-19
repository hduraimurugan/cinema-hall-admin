import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Users, RefreshCw, CheckCircle2, X } from "lucide-react"
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((c) => (
                  <TableRow key={c.id} className="border-border/40 hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full ${avatarColor(c.name || "")} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                          {getInitials(c.name)}
                        </div>
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
                      {c.is_verified ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                          <CheckCircle2 className="w-3 h-3" /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/25">
                          Unverified
                        </span>
                      )}
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
