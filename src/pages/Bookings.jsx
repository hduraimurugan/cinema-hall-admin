import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, ChevronLeft, ChevronRight, Ticket, SlidersHorizontal, X, Monitor, CalendarDays, CalendarIcon, RefreshCw, IndianRupee, Receipt, Percent } from "lucide-react"
import { bookingAPI, screensAPI } from "../services/api"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import dayjs from "dayjs"

function debounce(fn, delay) {
  let t
  return (...args) => {
    clearTimeout(t)
    t = setTimeout(() => fn(...args), delay)
  }
}

const statusConfig = {
  confirmed: { label: "Confirmed", className: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25" },
  cancelled:  { label: "Cancelled",  className: "bg-red-500/15 text-red-400 border border-red-500/25" },
  completed:  { label: "Completed",  className: "bg-blue-500/15 text-blue-400 border border-blue-500/25" },
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

const Bookings = () => {
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState(null)
  const [statsLoading, setStatsLoading] = useState(true)

  const [date, setDate] = useState("")
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [screenId, setScreenId] = useState("all")
  const [screens, setScreens] = useState([])
  const [searchInput, setSearchInput] = useState("")

  const totalPages = Math.max(1, Math.ceil(total / 50))

  const fetchBookings = useCallback((filters) => {
    setLoading(true)
    setStatsLoading(true)
    setError(null)
    bookingAPI.getCinemaHallBookings(filters)
      .then(data => {
        setBookings(data.bookings || [])
        setTotal(data.total || 0)
        setStats(data.stats || null)
        setStatsLoading(false)
      })
      .catch(err => setError(err?.message || "Failed to load bookings"))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    screensAPI.getMyScreens().then(data => setScreens(data || [])).catch(() => {})
  }, [])

  useEffect(() => {
    fetchBookings({ date, search, status: status === "all" ? "" : status, screen_id: screenId === "all" ? "" : screenId, page })
  }, [date, search, status, screenId, page, fetchBookings])

  const debouncedSearch = useCallback(
    debounce((val) => { setSearch(val); setPage(1) }, 400),
    []
  )

  const handleSearchChange = (e) => { setSearchInput(e.target.value); debouncedSearch(e.target.value) }
  const handleDateChange = (d) => { setDate(d ? dayjs(d).format("YYYY-MM-DD") : ""); setPage(1) }
  const handleStatusChange = (val) => { setStatus(val); setPage(1) }
  const handleScreenChange = (val) => { setScreenId(val); setPage(1) }

  const handleClear = () => {
    setDate(""); setSearch(""); setSearchInput("")
    setStatus("all"); setScreenId("all"); setPage(1)
  }

  const hasFilters = date || search || status !== "all" || screenId !== "all"
  const activeFilterCount = [date, search, status !== "all" ? status : "", screenId !== "all" ? screenId : ""].filter(Boolean).length

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Ticket className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Bookings</h1>
            <p className="text-sm text-muted-foreground">Manage and track all cinema bookings</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {total > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-primary inline-block" />
              {total} booking{total !== 1 ? "s" : ""}
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchBookings({ date, search, status: status === "all" ? "" : status, screen_id: screenId === "all" ? "" : screenId, page })}
            disabled={loading}
            className="h-8 gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Bookings</p>
              <div className="p-1.5 rounded-md bg-primary/10">
                <Ticket className="w-3.5 h-3.5 text-primary" />
              </div>
            </div>
            {statsLoading ? <Skeleton className="h-7 w-20" /> : (
              <p className="text-2xl font-bold">{total.toLocaleString("en-IN")}</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Revenue</p>
              <div className="p-1.5 rounded-md bg-emerald-500/10">
                <IndianRupee className="w-3.5 h-3.5 text-emerald-500" />
              </div>
            </div>
            {statsLoading ? <Skeleton className="h-7 w-24" /> : (
              <p className="text-2xl font-bold">
                ₹{(stats?.total_revenue ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Convenience Fees Collected</p>
              <div className="p-1.5 rounded-md bg-sky-500/10">
                <Receipt className="w-3.5 h-3.5 text-sky-500" />
              </div>
            </div>
            {statsLoading ? <Skeleton className="h-7 w-24" /> : (
              <p className="text-2xl font-bold">
                ₹{(stats?.total_convenience_fee ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">GST Collected</p>
              <div className="p-1.5 rounded-md bg-amber-500/10">
                <Percent className="w-3.5 h-3.5 text-amber-500" />
              </div>
            </div>
            {statsLoading ? <Skeleton className="h-7 w-24" /> : (
              <p className="text-2xl font-bold">
                ₹{(stats?.total_gst ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-border/60">
        <CardHeader className="pb-3 pt-4 px-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold leading-none">
                  {activeFilterCount}
                </span>
              )}
            </div>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={handleClear} className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                <X className="w-3 h-3" /> Clear all
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <CalendarDays className="w-3 h-3" /> Show Date
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "h-9 w-full justify-start text-left text-sm font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                    {date ? dayjs(date).format("MMM D, YYYY") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date ? dayjs(date).toDate() : undefined}
                    onSelect={handleDateChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Search className="w-3 h-3" /> Movie
              </label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search by movie..."
                  value={searchInput}
                  onChange={handleSearchChange}
                  className="pl-8 h-9 text-sm"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Monitor className="w-3 h-3" /> Screen
              </label>
              <Select value={screenId} onValueChange={handleScreenChange}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Screens</SelectItem>
                  {screens.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-muted-foreground/40 inline-block" /> Status
              </label>
              <Select value={status} onValueChange={handleStatusChange}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-border/60">
        <CardHeader className="pb-0 pt-4 px-5">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">All Bookings</CardTitle>
            {!loading && bookings.length > 0 && (
              <span className="text-xs text-muted-foreground">
                Showing {bookings.length} of {total}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-3 px-5">
          {error ? (
            <div className="flex flex-col items-center py-16 text-destructive gap-2">
              <Ticket className="w-10 h-10 opacity-40" />
              <p className="text-sm">{error}</p>
            </div>
          ) : loading ? (
            <div className="space-y-2.5 py-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-muted-foreground gap-3">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <Ticket className="w-8 h-8 opacity-40" />
              </div>
              <div className="text-center">
                <p className="font-medium text-foreground">No bookings found</p>
                <p className="text-sm mt-1">Try adjusting your filters</p>
              </div>
              {hasFilters && (
                <Button variant="outline" size="sm" onClick={handleClear}>Clear filters</Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/50">
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Customer</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Movie</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Show</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Screen</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Seats</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Amount</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Booking ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((b) => {
                  const showDate = b.show_date
                    ? new Date(b.show_date).toLocaleDateString("en-IN", { dateStyle: "medium" })
                    : "—"
                  const showTime = b.start_time ? b.start_time.slice(0, 5) : ""
                  const sc = statusConfig[b.booking_status]

                  return (
                    <TableRow key={b.id} className="border-border/40 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => navigate(`/bookings/${b.id}`)}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full ${avatarColor(b.customer_name || "")} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                            {getInitials(b.customer_name)}
                          </div>
                          <div>
                            <p className="font-medium text-sm leading-tight">{b.customer_name || "—"}</p>
                            <p className="text-xs text-muted-foreground leading-tight">{b.customer_email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-sm">{b.movie_title}</span>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">{showDate}</p>
                        {showTime && <p className="text-xs text-muted-foreground">{showTime}</p>}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground text-xs font-medium">
                          <Monitor className="w-3 h-3 opacity-60" />
                          {b.screen_name || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(b.seat_labels || []).map((s, i) => (
                            <span key={i} className="px-1.5 py-0.5 bg-primary/10 text-primary text-xs rounded font-semibold border border-primary/20">
                              {s}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-sm">₹{Number(b.total_amount).toLocaleString("en-IN")}</span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${sc?.className || "bg-muted text-muted-foreground"}`}>
                          {sc?.label || b.booking_status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {b.id?.substring(0, 8)}
                        </code>
                      </TableCell>
                    </TableRow>
                  )
                })}
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => p - 1)}
                  disabled={page === 1}
                  className="h-8 px-3 gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => p + 1)}
                  disabled={page === totalPages}
                  className="h-8 px-3 gap-1"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Bookings
