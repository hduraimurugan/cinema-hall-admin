import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChevronDown, RefreshCw, IndianRupee, CheckCircle2, AlertCircle, Clock, CalendarDays, CalendarIcon, SlidersHorizontal, X } from "lucide-react"
import { refundAPI } from "../services/api"
import { Pagination } from "@/components/ui/Pagination"
import { toast } from "sonner"
import dayjs from "dayjs"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"

const refundStatusConfig = {
  initiated: {
    label: "Initiated",
    className: "bg-amber-500/15 text-amber-400 border border-amber-500/25",
    icon: Clock,
  },
  settled: {
    label: "Settled",
    className: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25",
    icon: CheckCircle2,
  },
  failed: {
    label: "Failed",
    className: "bg-red-500/15 text-red-400 border border-red-500/25",
    icon: AlertCircle,
  },
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

function fmt(v) {
  return Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const RefundsPage = () => {
  const navigate = useNavigate()
  const [refunds, setRefunds] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [status, setStatus] = useState("all")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [loading, setLoading] = useState(true)
  const [settling, setSettling] = useState(null) // refund_id being settled

  const totalPages = Math.max(1, Math.ceil(total / limit))

  const fetchRefunds = useCallback((filters) => {
    setLoading(true)
    refundAPI.getRefunds(filters)
      .then(data => {
        setRefunds(data.refunds || [])
        setTotal(data.total || 0)
      })
      .catch(err => toast.error(err.message || "Failed to load refunds"))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchRefunds({ status, from_date: fromDate, to_date: toDate, page, limit })
  }, [status, fromDate, toDate, page, limit, fetchRefunds])

  const handleStatusChange = (val) => { setStatus(val); setPage(1) }
  const handleFromDateChange = (d) => { setFromDate(d ? dayjs(d).format("YYYY-MM-DD") : ""); setPage(1) }
  const handleToDateChange = (d) => { setToDate(d ? dayjs(d).format("YYYY-MM-DD") : ""); setPage(1) }

  const hasFilters = status !== "all" || fromDate || toDate
  const activeFilterCount = [fromDate, toDate, status !== "all" ? status : ""].filter(Boolean).length
  const [filtersOpen, setFiltersOpen] = useState(false)

  const handleClear = () => { setStatus("all"); setFromDate(""); setToDate(""); setPage(1) }

  const handleSettle = async (refundId) => {
    setSettling(refundId)
    try {
      await refundAPI.settleRefund(refundId)
      toast.success("Refund marked as settled")
      fetchRefunds({ status, from_date: fromDate, to_date: toDate, page, limit })
    } catch (err) {
      toast.error(err.message || "Failed to settle refund")
    } finally {
      setSettling(null)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <IndianRupee className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Refunds</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Track refund status for cancelled show bookings</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!loading && total > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-primary inline-block" />
              {total} refund{total !== 1 ? "s" : ""}
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchRefunds({ status, from_date: fromDate, to_date: toDate, page, limit })}
            className="gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Initiated", key: "initiated", color: "text-amber-400", bg: "bg-amber-500/10" },
          { label: "Settled",   key: "settled",   color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "Failed",    key: "failed",    color: "text-red-400", bg: "bg-red-500/10" },
        ].map(({ label, key, color, bg }) => {
          const count = refunds.filter(r => r.refund_status === key).length
          return (
            <Card key={key} className={`border-0 ${bg} cursor-pointer`} onClick={() => handleStatusChange(key)}>
              <CardContent className="px-5 py-4 flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">{label}</span>
                <span className={`text-2xl font-bold ${color}`}>{loading ? "—" : count}</span>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Filters */}
      <Card className="border-border/60">
        <div
          className="flex items-center justify-between px-4 py-2.5 cursor-pointer select-none"
          onClick={() => setFiltersOpen(o => !o)}
        >
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold leading-none">
                {activeFilterCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => { e.stopPropagation(); handleClear() }}
                className="h-6 px-2 gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3" /> Clear
              </Button>
            )}
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${filtersOpen ? "rotate-180" : ""}`} />
          </div>
        </div>
        {filtersOpen && (
          <div className="px-4 pb-3 pt-2 border-t border-border/40">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <CalendarDays className="w-3 h-3" /> From Date
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn("h-8 w-full justify-start text-left text-xs font-normal", !fromDate && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-1.5 h-3 w-3" />
                      {fromDate ? dayjs(fromDate).format("MMM D, YYYY") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={fromDate ? dayjs(fromDate).toDate() : undefined} onSelect={handleFromDateChange} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <CalendarDays className="w-3 h-3" /> To Date
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn("h-8 w-full justify-start text-left text-xs font-normal", !toDate && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-1.5 h-3 w-3" />
                      {toDate ? dayjs(toDate).format("MMM D, YYYY") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={toDate ? dayjs(toDate).toDate() : undefined} onSelect={handleToDateChange} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-muted-foreground/40 inline-block" /> Status
                </label>
                <Select value={status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="initiated">Initiated</SelectItem>
                    <SelectItem value="settled">Settled</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Table */}
      <Card className="border-border/60">
        <CardHeader className="px-5 py-4 border-b border-border/40">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <IndianRupee className="w-4 h-4 text-primary" />
            Refund Records
            {!loading && <span className="text-muted-foreground font-normal">({total})</span>}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <Table>
              <TableHeader>
                <TableRow className="border-border/40">
                  <TableHead className="pl-5">Customer</TableHead>
                  <TableHead>Movie / Show</TableHead>
                  <TableHead>Seats</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Initiated</TableHead>
                  <TableHead>Settled</TableHead>
                  <TableHead className="pr-5 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(6)].map((_, i) => (
                  <TableRow key={i} className="border-border/40">
                    <TableCell className="pl-5">
                      <div className="flex items-center gap-2.5">
                        <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                        <div className="space-y-1.5">
                          <Skeleton className="h-3.5 w-28 rounded" />
                          <Skeleton className="h-3 w-36 rounded" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1.5">
                        <Skeleton className="h-3.5 w-28 rounded" />
                        <Skeleton className="h-3 w-32 rounded" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Skeleton className="h-5 w-8 rounded" />
                        <Skeleton className="h-5 w-8 rounded" />
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-3.5 w-16 rounded" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-3 w-24 rounded" /></TableCell>
                    <TableCell><Skeleton className="h-3 w-24 rounded" /></TableCell>
                    <TableCell className="pr-5 text-right">
                      <Skeleton className="h-6 w-24 rounded ml-auto" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : refunds.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
              <CheckCircle2 className="w-10 h-10 opacity-20" />
              <p className="text-sm">No refunds found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border/40">
                  <TableHead className="pl-5">Customer</TableHead>
                  <TableHead>Movie / Show</TableHead>
                  <TableHead>Seats</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Initiated</TableHead>
                  <TableHead>Settled</TableHead>
                  <TableHead className="pr-5 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {refunds.map((r) => {
                  const sc = refundStatusConfig[r.refund_status] || refundStatusConfig.initiated
                  const StatusIcon = sc.icon
                  return (
                    <TableRow
                      key={r.refund_id}
                      className="border-border/40 cursor-pointer hover:bg-muted/40"
                      onClick={() => navigate(`/bookings/${r.booking_id}`)}
                    >
                      <TableCell className="pl-5">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full ${avatarColor(r.customer_name || "")} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                            {getInitials(r.customer_name)}
                          </div>
                          <div>
                            <p className="text-sm font-medium leading-tight">{r.customer_name || "—"}</p>
                            <p className="text-xs text-muted-foreground">{r.customer_email || "—"}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">{r.movie_title}</p>
                        <p className="text-xs text-muted-foreground">
                          {dayjs(r.show_date).format("DD MMM YYYY")} · {r.start_time?.slice(0, 5)}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(r.seat_labels || []).map((s, i) => (
                            <span key={i} className="px-1.5 py-0.5 bg-primary/10 text-primary text-xs rounded font-semibold border border-primary/20">
                              {s}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">₹{fmt(r.amount)}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${sc.className}`}>
                          <StatusIcon className="w-3 h-3" />
                          {sc.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {r.initiated_at ? dayjs(r.initiated_at).format("DD MMM, h:mm A") : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {r.settled_at ? dayjs(r.settled_at).format("DD MMM, h:mm A") : "—"}
                      </TableCell>
                      <TableCell className="pr-5 text-right" onClick={e => e.stopPropagation()}>
                        {r.refund_status === "initiated" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1 border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/10"
                            disabled={settling === r.refund_id}
                            onClick={() => handleSettle(r.refund_id)}
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            {settling === r.refund_id ? "Settling…" : "Mark Settled"}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {!loading && total > 0 && (
            <div className="px-5 pb-3">
              <Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={setPage} onLimitChange={(v) => { setLimit(v); setPage(1) }} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default RefundsPage
