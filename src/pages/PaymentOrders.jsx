import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, ChevronLeft, ChevronRight, CreditCard, SlidersHorizontal, X, CalendarDays, CalendarIcon, User, RefreshCw } from "lucide-react"
import { paymentAPI } from "../services/api"
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
  created: { label: "Created",  className: "bg-amber-500/15 text-amber-400 border border-amber-500/25" },
  paid:    { label: "Paid",     className: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25" },
  failed:  { label: "Failed",   className: "bg-red-500/15 text-red-400 border border-red-500/25" },
  expired: { label: "Expired",  className: "bg-muted text-muted-foreground border border-border" },
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

const PaymentOrders = () => {
  const [orders, setOrders] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [date, setDate] = useState("")
  const [status, setStatus] = useState("all")
  const [customer, setCustomer] = useState("")
  const [customerInput, setCustomerInput] = useState("")
  const [movie, setMovie] = useState("")
  const [movieInput, setMovieInput] = useState("")

  const totalPages = Math.max(1, Math.ceil(total / 50))

  const fetchOrders = useCallback((filters) => {
    setLoading(true)
    setError(null)
    paymentAPI.getOrders(filters)
      .then(data => {
        setOrders(data.orders || [])
        setTotal(data.total || 0)
      })
      .catch(err => setError(err?.error || err?.message || "Failed to load payment orders"))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchOrders({ date, status: status === "all" ? "" : status, customer, movie, page })
  }, [date, status, customer, movie, page, fetchOrders])

  const debouncedCustomer = useCallback(
    debounce((val) => { setCustomer(val); setPage(1) }, 400), []
  )
  const debouncedMovie = useCallback(
    debounce((val) => { setMovie(val); setPage(1) }, 400), []
  )

  const handleCustomerChange = (e) => { setCustomerInput(e.target.value); debouncedCustomer(e.target.value) }
  const handleMovieChange    = (e) => { setMovieInput(e.target.value);    debouncedMovie(e.target.value) }
  const handleDateChange     = (d) => { setDate(d ? dayjs(d).format("YYYY-MM-DD") : ""); setPage(1) }
  const handleStatusChange   = (val) => { setStatus(val); setPage(1) }

  const handleClear = () => {
    setDate(""); setStatus("all")
    setCustomer(""); setCustomerInput("")
    setMovie(""); setMovieInput("")
    setPage(1)
  }

  const hasFilters = date || customer || movie || status !== "all"
  const activeFilterCount = [date, customer, movie, status !== "all" ? status : ""].filter(Boolean).length

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <CreditCard className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Payment Orders</h1>
            <p className="text-sm text-muted-foreground">Track all Razorpay payment orders</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {total > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-primary inline-block" />
              {total} order{total !== 1 ? "s" : ""}
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchOrders({ date, status: status === "all" ? "" : status, customer, movie, page })}
            disabled={loading}
            className="h-8 gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
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
            {/* Date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <CalendarDays className="w-3 h-3" /> Order Date
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

            {/* Customer search */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <User className="w-3 h-3" /> Customer
              </label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Name or email..."
                  value={customerInput}
                  onChange={handleCustomerChange}
                  className="pl-8 h-9 text-sm"
                />
              </div>
            </div>

            {/* Movie search */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Search className="w-3 h-3" /> Movie
              </label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search by movie..."
                  value={movieInput}
                  onChange={handleMovieChange}
                  className="pl-8 h-9 text-sm"
                />
              </div>
            </div>

            {/* Status */}
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
                  <SelectItem value="created">Created</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
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
            <CardTitle className="text-base font-semibold">All Payment Orders</CardTitle>
            {!loading && orders.length > 0 && (
              <span className="text-xs text-muted-foreground">
                Showing {orders.length} of {total}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-3 px-5">
          {error ? (
            <div className="flex flex-col items-center py-16 text-destructive gap-2">
              <CreditCard className="w-10 h-10 opacity-40" />
              <p className="text-sm">{error}</p>
            </div>
          ) : loading ? (
            <div className="space-y-2.5 py-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-muted-foreground gap-3">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <CreditCard className="w-8 h-8 opacity-40" />
              </div>
              <div className="text-center">
                <p className="font-medium text-foreground">No payment orders found</p>
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
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Seats</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Amount</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Order ID</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Payment ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => {
                  const showDate = o.show_date
                    ? new Date(o.show_date).toLocaleDateString("en-IN", { dateStyle: "medium" })
                    : "—"
                  const showTime = o.start_time ? o.start_time.slice(0, 5) : ""
                  const sc = statusConfig[o.status]

                  return (
                    <TableRow key={o.id} className="border-border/40 hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full ${avatarColor(o.customer_name || "")} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                            {getInitials(o.customer_name)}
                          </div>
                          <div>
                            <p className="font-medium text-sm leading-tight">{o.customer_name || "—"}</p>
                            <p className="text-xs text-muted-foreground leading-tight">{o.customer_email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-sm">{o.movie_title}</span>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">{showDate}</p>
                        {showTime && <p className="text-xs text-muted-foreground">{showTime}</p>}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(o.seat_labels || []).map((s, i) => (
                            <span key={i} className="px-1.5 py-0.5 bg-primary/10 text-primary text-xs rounded font-semibold border border-primary/20">
                              {s}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-sm">₹{Number(o.amount).toLocaleString("en-IN")}</span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${sc?.className || "bg-muted text-muted-foreground"}`}>
                          {sc?.label || o.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {o.order_id?.substring(0, 18)}
                        </code>
                      </TableCell>
                      <TableCell>
                        {o.payment_id ? (
                          <code className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            {o.payment_id.substring(0, 12)}
                          </code>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
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

export default PaymentOrders
