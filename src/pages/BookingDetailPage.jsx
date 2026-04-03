import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft, User, CreditCard, Ticket, Monitor,
  CalendarDays, Clock, Tag, IndianRupee, Receipt, Percent,
  RefreshCw, CheckCircle2, AlertCircle, ExternalLink, Copy, Check
} from "lucide-react"
import { bookingAPI, refundAPI } from "../services/api"
import { toast } from "sonner"
import dayjs from "dayjs"

const refundStatusConfig = {
  initiated: {
    label: "Refund Initiated",
    className: "bg-amber-500/15 text-amber-400 border border-amber-500/25",
    icon: Clock,
  },
  settled: {
    label: "Refund Settled",
    className: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25",
    icon: CheckCircle2,
  },
  failed: {
    label: "Refund Failed",
    className: "bg-red-500/15 text-red-400 border border-red-500/25",
    icon: AlertCircle,
  },
}

const statusConfig = {
  confirmed: { label: "Confirmed", className: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25" },
  cancelled:  { label: "Cancelled",  className: "bg-red-500/15 text-red-400 border border-red-500/25" },
  completed:  { label: "Completed",  className: "bg-blue-500/15 text-blue-400 border border-blue-500/25" },
}

const paymentStatusConfig = {
  completed: { label: "Paid",    className: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25" },
  pending:   { label: "Pending", className: "bg-amber-500/15 text-amber-400 border border-amber-500/25" },
  failed:    { label: "Failed",  className: "bg-red-500/15 text-red-400 border border-red-500/25" },
}

const avatarColors = [
  "bg-violet-500", "bg-sky-500", "bg-rose-500",
  "bg-amber-500", "bg-teal-500", "bg-pink-500",
]

function getInitials(name = "") {
  return name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase() || "?"
}

function avatarColor(name = "") {
  const code = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return avatarColors[code % avatarColors.length]
}

function fmt(value) {
  return Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-border/40 last:border-0">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-medium text-right break-all">{value}</span>
    </div>
  )
}

function PriceRow({ label, value, className = "", icon: Icon }) {
  return (
    <div className={`flex items-center justify-between py-2 ${className}`}>
      <span className="text-sm text-muted-foreground flex items-center gap-1.5">
        {Icon && <Icon className="w-3.5 h-3.5" />}
        {label}
      </span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  )
}

const BookingDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [settling, setSettling] = useState(false)
  const [copiedField, setCopiedField] = useState(null)

  const copyValue = (field, value, label = "Copied!") => {
    navigator.clipboard.writeText(value)
    setCopiedField(field)
    toast.success(label)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const loadBooking = () => {
    bookingAPI.getBookingById(id)
      .then(data => setBooking(data.booking))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadBooking() }, [id])

  const handleSettle = async () => {
    if (!booking?.refund_id) return
    setSettling(true)
    try {
      await refundAPI.settleRefund(booking.refund_id)
      toast.success("Refund marked as settled")
      loadBooking()
    } catch (err) {
      toast.error(err.message || "Failed to settle refund")
    } finally {
      setSettling(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-80" />
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-56 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <Ticket className="w-8 h-8 opacity-40" />
        </div>
        <p className="text-muted-foreground text-sm">{error || "Booking not found"}</p>
        <Button variant="outline" size="sm" onClick={() => navigate("/bookings")}>
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Bookings
        </Button>
      </div>
    )
  }

  const sc = statusConfig[booking.booking_status]
  const pc = paymentStatusConfig[booking.payment_status] || paymentStatusConfig.pending

  const totalAmount    = Number(booking.total_amount || 0)
  const convenienceFee = Number(booking.convenience_fee || 0)
  const gstAmount      = Number(booking.gst_amount || 0)
  const discountAmount = Number(booking.discount_amount || 0)
  const seatSubtotal   = totalAmount + discountAmount - convenienceFee - gstAmount

  const showDate  = booking.show_date
    ? dayjs(booking.show_date).format("DD MMM YYYY")
    : "—"
  const showTime  = booking.start_time ? booking.start_time.slice(0, 5) : ""
  const bookedAt  = booking.created_at
    ? dayjs(booking.created_at).format("DD MMM YYYY, h:mm A")
    : "—"
  const seatCount = (booking.seat_labels || booking.seats || []).length

  return (
    <div className="p-6 space-y-6">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/bookings")}
        className="h-8 gap-1.5 -ml-1 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Bookings
      </Button>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">{booking.movie_title}</h1>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${sc?.className || "bg-muted text-muted-foreground"}`}>
              {sc?.label || booking.booking_status}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-muted-foreground">Booking ID:</span>
            <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{booking.id}</code>
            <button
              onClick={() => copyValue("bookingId", booking.id, "Booking ID copied!")}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Copy Booking ID"
            >
              {copiedField === "bookingId" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-4">

          {/* Show & Movie Info */}
          <Card className="border-border/60">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Ticket className="w-4 h-4 text-primary" /> Show Details
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4 space-y-0">
              <InfoRow label="Movie" value={booking.movie_title} />
              <div className="flex items-start justify-between gap-4 py-2.5 border-b border-border/40">
                <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5" /> Date
                </span>
                <span className="text-sm font-medium">{showDate}</span>
              </div>
              {showTime && (
                <div className="flex items-start justify-between gap-4 py-2.5 border-b border-border/40">
                  <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Time
                  </span>
                  <span className="text-sm font-medium">{showTime}</span>
                </div>
              )}
              <div className="flex items-start justify-between gap-4 py-2.5 border-b border-border/40">
                <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Monitor className="w-3.5 h-3.5" /> Screen
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground text-xs font-medium">
                  <Monitor className="w-3 h-3 opacity-60" />
                  {booking.screen_name || "—"}
                </span>
              </div>
              <div className="flex items-start justify-between gap-4 py-2.5">
                <span className="text-sm text-muted-foreground">
                  Seats ({seatCount})
                </span>
                <div className="flex flex-wrap gap-1 justify-end">
                  {(booking.seat_labels || []).map((s, i) => (
                    <span key={i} className="px-1.5 py-0.5 bg-primary/10 text-primary text-xs rounded font-semibold border border-primary/20">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Info */}
          <Card className="border-border/60">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <User className="w-4 h-4 text-primary" /> Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${avatarColor(booking.customer_name || "")} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                  {getInitials(booking.customer_name)}
                </div>
                <div>
                  <p className="font-medium text-sm">{booking.customer_name || "—"}</p>
                  <p className="text-xs text-muted-foreground">{booking.customer_email || "—"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Info */}
          <Card className="border-border/60">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary" /> Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4 space-y-0">
              <div className="flex items-start justify-between gap-4 py-2.5 border-b border-border/40">
                <span className="text-sm text-muted-foreground">Status</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${pc.className}`}>
                  {pc.label}
                </span>
              </div>
              <div className="flex items-start justify-between gap-4 py-2.5 border-b border-border/40">
                <span className="text-sm text-muted-foreground">Payment ID</span>
                <div className="flex items-center gap-1.5">
                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono break-all text-right max-w-[60%]">
                    {booking.payment_id || "—"}
                  </code>
                  {booking.payment_id && (
                    <button
                      onClick={() => copyValue("paymentId", booking.payment_id, "Payment ID copied!")}
                      className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                      title="Copy Payment ID"
                    >
                      {copiedField === "paymentId" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-start justify-between gap-4 py-2.5">
                <span className="text-sm text-muted-foreground">Booked at</span>
                <span className="text-sm font-medium">{bookedAt}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-4">

          {/* Price Breakdown */}
          <Card className="border-border/60">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-primary" /> Price Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              <PriceRow
                label={`Tickets (${seatCount})`}
                value={`₹${fmt(seatSubtotal)}`}
                icon={Ticket}
              />
              <PriceRow
                label="Convenience fee"
                value={`₹${fmt(convenienceFee)}`}
                icon={Receipt}
              />
              <PriceRow
                label="GST"
                value={`₹${fmt(gstAmount)}`}
                icon={Percent}
              />
              {discountAmount > 0 && (
                <PriceRow
                  label="Offer discount"
                  value={`- ₹${fmt(discountAmount)}`}
                  className="text-emerald-500"
                  icon={Tag}
                />
              )}
              <div className="border-t border-border/50 mt-2 pt-3 flex items-center justify-between">
                <span className="text-sm font-semibold">Total</span>
                <span className="text-base font-bold">₹{fmt(totalAmount)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Offer Applied */}
          {booking.offer_code && (
            <Card className="border-border/60">
              <CardHeader className="pb-2 pt-4 px-5">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Tag className="w-4 h-4 text-emerald-500" /> Offer Applied
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-4 space-y-0">
                <div className="flex items-center justify-between py-2.5 border-b border-border/40">
                  <span className="text-sm text-muted-foreground">Code</span>
                  <code className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-2 py-0.5 rounded font-mono font-semibold tracking-wider">
                    {booking.offer_code}
                  </code>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-sm text-muted-foreground">Discount</span>
                  <span className="text-sm font-semibold text-emerald-500">- ₹{fmt(discountAmount)}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Refund Info — shown only for cancelled bookings */}
          {booking.booking_status === "cancelled" && (
            <Card className="border-border/60">
              <CardHeader className="pb-2 pt-4 px-5">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-primary" /> Refund
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-4 space-y-0">
                {booking.refund_status ? (
                  <>
                    {(() => {
                      const rc = refundStatusConfig[booking.refund_status] || refundStatusConfig.initiated
                      const RIcon = rc.icon
                      return (
                        <div className="flex items-center justify-between py-2.5 border-b border-border/40">
                          <span className="text-sm text-muted-foreground">Status</span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${rc.className}`}>
                            <RIcon className="w-3 h-3" />
                            {rc.label}
                          </span>
                        </div>
                      )
                    })()}
                    <div className="flex items-center justify-between py-2.5 border-b border-border/40">
                      <span className="text-sm text-muted-foreground">Refund Amount</span>
                      <span className="text-sm font-semibold">₹{fmt(booking.refund_amount)}</span>
                    </div>
                    {booking.razorpay_refund_id && (
                      <div className="flex items-start justify-between gap-4 py-2.5 border-b border-border/40">
                        <span className="text-sm text-muted-foreground">Refund ID</span>
                        <div className="flex items-center gap-1.5">
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono break-all text-right max-w-[60%]">
                            {booking.razorpay_refund_id}
                          </code>
                          <button
                            onClick={() => copyValue("refundId", booking.razorpay_refund_id, "Refund ID copied!")}
                            className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                            title="Copy Refund ID"
                          >
                            {copiedField === "refundId" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    )}
                    {booking.refund_initiated_at && (
                      <div className="flex items-center justify-between py-2.5 border-b border-border/40">
                        <span className="text-sm text-muted-foreground">Initiated</span>
                        <span className="text-sm">{dayjs(booking.refund_initiated_at).format("DD MMM YYYY, h:mm A")}</span>
                      </div>
                    )}
                    {booking.refund_settled_at && (
                      <div className="flex items-center justify-between py-2.5 border-b border-border/40">
                        <span className="text-sm text-muted-foreground">Settled</span>
                        <span className="text-sm text-emerald-500 font-medium">{dayjs(booking.refund_settled_at).format("DD MMM YYYY, h:mm A")}</span>
                      </div>
                    )}
                    {booking.refund_failure_reason && (
                      <div className="py-2.5 border-b border-border/40">
                        <span className="text-sm text-muted-foreground block mb-1">Failure Reason</span>
                        <span className="text-xs text-red-400">{booking.refund_failure_reason}</span>
                      </div>
                    )}
                    {booking.refund_status === "initiated" && (
                      <div className="pt-3 flex flex-col gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full gap-1.5 border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/10"
                          disabled={settling}
                          onClick={handleSettle}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {settling ? "Settling…" : "Mark as Settled"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="w-full gap-1.5 text-muted-foreground"
                          onClick={() => navigate("/refunds")}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          View All Refunds
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground py-2">No refund record found for this booking.</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default BookingDetailPage
