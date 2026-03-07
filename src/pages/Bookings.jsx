import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, ChevronLeft, ChevronRight, Ticket } from "lucide-react"
import { bookingAPI } from "../services/api"

function debounce(fn, delay) {
  let t
  return (...args) => {
    clearTimeout(t)
    t = setTimeout(() => fn(...args), delay)
  }
}

const statusVariants = {
  confirmed: "default",
  cancelled: "destructive",
  completed: "secondary",
}

const Bookings = () => {
  const [bookings, setBookings] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [date, setDate] = useState("")
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [searchInput, setSearchInput] = useState("")

  const totalPages = Math.max(1, Math.ceil(total / 50))

  const fetchBookings = useCallback((filters) => {
    setLoading(true)
    setError(null)
    bookingAPI.getCinemaHallBookings(filters)
      .then(data => {
        setBookings(data.bookings || [])
        setTotal(data.total || 0)
      })
      .catch(err => setError(err?.message || "Failed to load bookings"))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchBookings({ date, search, status: status === "all" ? "" : status, page })
  }, [date, search, status, page, fetchBookings])

  const debouncedSearch = useCallback(
    debounce((val) => {
      setSearch(val)
      setPage(1)
    }, 400),
    []
  )

  const handleSearchChange = (e) => {
    setSearchInput(e.target.value)
    debouncedSearch(e.target.value)
  }

  const handleDateChange = (e) => {
    setDate(e.target.value)
    setPage(1)
  }

  const handleStatusChange = (val) => {
    setStatus(val)
    setPage(1)
  }

  const handleClear = () => {
    setDate("")
    setSearch("")
    setSearchInput("")
    setStatus("all")
    setPage(1)
  }

  const hasFilters = date || search || status !== "all"

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Bookings</h1>
        {total > 0 && (
          <span className="text-sm text-muted-foreground">{total} total booking{total !== 1 ? "s" : ""}</span>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Show Date</label>
              <Input
                type="date"
                value={date}
                onChange={handleDateChange}
                className="w-44"
              />
            </div>

            <div className="flex flex-col gap-1 flex-1 min-w-48">
              <label className="text-xs font-medium text-muted-foreground">Movie</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by movie..."
                  value={searchInput}
                  onChange={handleSearchChange}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <Select value={status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-40">
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

            {hasFilters && (
              <Button variant="outline" onClick={handleClear} className="self-end">
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-base font-semibold">All Bookings</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {error ? (
            <p className="text-center text-destructive py-10">{error}</p>
          ) : loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Ticket className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No bookings found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Movie</TableHead>
                  <TableHead>Show</TableHead>
                  <TableHead>Screen</TableHead>
                  <TableHead>Seats</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Booking ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((b) => {
                  const showDate = b.show_date
                    ? new Date(b.show_date).toLocaleDateString("en-IN", { dateStyle: "medium" })
                    : "—"
                  const showTime = b.start_time ? b.start_time.slice(0, 5) : ""

                  return (
                    <TableRow key={b.id}>
                      <TableCell>
                        <p className="font-medium">{b.customer_name || "—"}</p>
                        <p className="text-xs text-muted-foreground">{b.customer_email}</p>
                      </TableCell>
                      <TableCell className="font-medium">{b.movie_title}</TableCell>
                      <TableCell>
                        <p>{showDate}</p>
                        {showTime && <p className="text-xs text-muted-foreground">{showTime}</p>}
                      </TableCell>
                      <TableCell>{b.screen_name || "—"}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(b.seat_labels || []).map((s, i) => (
                            <span key={i} className="px-2 py-0.5 bg-secondary text-secondary-foreground text-xs rounded font-semibold">
                              {s}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">₹{b.total_amount}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariants[b.booking_status] || "default"}>
                          {b.booking_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {b.id?.substring(0, 8)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => p - 1)}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => p + 1)}
                  disabled={page === totalPages}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
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
