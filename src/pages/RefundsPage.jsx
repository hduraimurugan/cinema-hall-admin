import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChevronLeft, ChevronRight, RefreshCw, RotateCcw, IndianRupee, CheckCircle2, AlertCircle, Clock } from "lucide-react"
import { refundAPI } from "../services/api"
import { toast } from "sonner"
import dayjs from "dayjs"

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
  const [status, setStatus] = useState("all")
  const [loading, setLoading] = useState(true)
  const [settling, setSettling] = useState(null) // refund_id being settled

  const totalPages = Math.max(1, Math.ceil(total / 50))

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
    fetchRefunds({ status, page })
  }, [status, page, fetchRefunds])

  const handleStatusChange = (val) => {
    setStatus(val)
    setPage(1)
  }

  const handleSettle = async (refundId) => {
    setSettling(refundId)
    try {
      await refundAPI.settleRefund(refundId)
      toast.success("Refund marked as settled")
      fetchRefunds({ status, page })
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
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Refunds</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Track refund status for cancelled show bookings</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchRefunds({ status, page })}
          className="gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </Button>
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
        <CardContent className="px-5 py-3 flex items-center gap-3">
          <Select value={status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-44 h-9">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="initiated">Initiated</SelectItem>
              <SelectItem value="settled">Settled</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          {status !== "all" && (
            <Button variant="ghost" size="sm" onClick={() => handleStatusChange("all")} className="h-9 gap-1.5 text-muted-foreground">
              <RotateCcw className="w-3.5 h-3.5" /> Clear
            </Button>
          )}
        </CardContent>
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
            <div className="p-5 space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
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
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-border/40">
              <p className="text-xs text-muted-foreground">Page {page} of {totalPages}</p>
              <div className="flex gap-1">
                <Button variant="outline" size="icon" className="h-7 w-7" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
                <Button variant="outline" size="icon" className="h-7 w-7" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default RefundsPage
