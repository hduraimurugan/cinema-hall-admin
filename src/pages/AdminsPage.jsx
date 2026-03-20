import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Building2, RefreshCw, X, MapPin } from "lucide-react"
import { adminsAPI } from "../services/api"

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

const AdminsPage = () => {
  const [admins, setAdmins] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")

  const totalPages = Math.max(1, Math.ceil(total / 50))

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
    fetchAdmins({ search, page })
  }, [search, page, fetchAdmins])

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
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAdmins({ search, page })}
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
            <div className="space-y-2.5 py-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
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
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Admin</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Phone</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cinema Hall</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Location</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Registered</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((a) => (
                  <TableRow key={a.id} className="border-border/40 hover:bg-muted/30 transition-colors">
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
                      <span className="text-sm text-muted-foreground">
                        {new Date(a.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
              <p className="text-sm text-muted-foreground">
                Page <span className="font-medium text-foreground">{page}</span> of <span className="font-medium text-foreground">{totalPages}</span>
              </p>
              <div className="flex gap-1.5">
                <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1} className="h-8 px-3 gap-1">
                  Prev
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page === totalPages} className="h-8 px-3 gap-1">
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default AdminsPage
