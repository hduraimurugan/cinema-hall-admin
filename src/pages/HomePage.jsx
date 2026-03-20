import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import {
  IndianRupee, Ticket, Users, Tag, Monitor, Clock,
  ArrowRight, RefreshCw, TrendingUp, Film,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { dashboardAPI } from '../services/api'

// ─── helpers ────────────────────────────────────────────────────────────────

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function fmt(n) {
  return Number(n ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })
}

function fmtRupee(n) {
  return '₹' + Number(n ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })
}

const statusConfig = {
  confirmed: { label: 'Confirmed', className: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' },
  cancelled:  { label: 'Cancelled',  className: 'bg-red-500/15 text-red-400 border border-red-500/25' },
  completed:  { label: 'Completed',  className: 'bg-blue-500/15 text-blue-400 border border-blue-500/25' },
}

function occupancyColor(booked, total) {
  if (!total) return 'text-muted-foreground'
  const pct = booked / total
  if (pct >= 0.8) return 'text-red-400'
  if (pct >= 0.5) return 'text-amber-400'
  return 'text-emerald-400'
}

function occupancyBg(booked, total) {
  if (!total) return 'bg-muted/50'
  const pct = booked / total
  if (pct >= 0.8) return 'bg-red-500/10'
  if (pct >= 0.5) return 'bg-amber-500/10'
  return 'bg-emerald-500/10'
}

// ─── custom chart tooltip ────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border/60 bg-card px-3 py-2 shadow-md text-sm">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      <p className="text-emerald-400">{fmtRupee(payload[0]?.value)} revenue</p>
      <p className="text-muted-foreground">{payload[0]?.payload?.bookings_count} bookings</p>
    </div>
  )
}

// ─── skeleton helpers ────────────────────────────────────────────────────────

function StatSkeleton() {
  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-7 rounded-md" />
        </div>
        <Skeleton className="h-7 w-28" />
      </CardContent>
    </Card>
  )
}

// ─── main component ──────────────────────────────────────────────────────────

const HomePage = () => {
  const { user, cinemaHall } = useAuth()
  const navigate = useNavigate()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchStats = useCallback(() => {
    setLoading(true)
    setError(null)
    dashboardAPI.getStats()
      .then(setData)
      .catch(err => setError(err?.message || err?.error || 'Failed to load dashboard'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchStats() }, [fetchStats])

  const today = data?.today
  const allTime = data?.allTime
  const trend = data?.revenueTrend ?? []
  const recentBookings = data?.recentBookings ?? []
  const todayShows = data?.todayShows ?? []

  // format trend dates for chart x-axis
  const chartData = trend.map(r => ({
    ...r,
    label: dayjs(r.date).format('ddd'),
    revenue: r.revenue,
  }))

  return (
    <div className="p-6 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {greeting()}, {user?.name?.split(' ')[0] ?? 'Admin'}!
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {cinemaHall?.name}
            {cinemaHall?.district ? ` · ${cinemaHall.district}` : ''}
            {cinemaHall?.state ? `, ${cinemaHall.state}` : ''}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {dayjs().format('dddd, D MMMM YYYY')}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchStats}
          disabled={loading}
          className="h-8 gap-1.5 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-center justify-between rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={fetchStats} className="h-7 text-xs">Retry</Button>
        </div>
      )}

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
        ) : (
          <>
            {/* Today's Revenue */}
            <Card className="border-border/60">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Today's Revenue</p>
                  <div className="p-1.5 rounded-md bg-emerald-500/10">
                    <IndianRupee className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                </div>
                <p className="text-2xl font-bold">{fmtRupee(today?.revenue)}</p>
                <p className="text-xs text-foreground mt-1">{fmt(today?.bookings)} bookings today</p>
              </CardContent>
            </Card>

            {/* Today's Bookings */}
            <Card className="border-border/60">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Today's Bookings</p>
                  <div className="p-1.5 rounded-md bg-primary/10">
                    <Ticket className="w-3.5 h-3.5 text-primary" />
                  </div>
                </div>
                <p className="text-2xl font-bold">{fmt(today?.bookings)}</p>
                <p className="text-xs text-muted-foreground mt-1">all-time: {fmt(allTime?.bookings)}</p>
              </CardContent>
            </Card>

            {/* Total Customers */}
            <Card className="border-border/60">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Customers</p>
                  <div className="p-1.5 rounded-md bg-sky-500/10">
                    <Users className="w-3.5 h-3.5 text-sky-500" />
                  </div>
                </div>
                <p className="text-2xl font-bold">{fmt(data?.customers)}</p>
                <p className="text-xs text-muted-foreground mt-1">{data?.screens ?? 0} screen{data?.screens !== 1 ? 's' : ''}</p>
              </CardContent>
            </Card>

            {/* Active Offers */}
            <Card className="border-border/60">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Active Offers</p>
                  <div className="p-1.5 rounded-md bg-violet-500/10">
                    <Tag className="w-3.5 h-3.5 text-violet-500" />
                  </div>
                </div>
                <p className="text-2xl font-bold">{fmt(data?.activeOffers)}</p>
                <p className="text-xs text-muted-foreground mt-1">all-time revenue: {fmtRupee(allTime?.revenue)}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* ── Revenue Trend Chart ── */}
      <Card className="border-border/60">
        <CardHeader className="pb-2 pt-4 px-5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-emerald-500/10">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <CardTitle className="text-base font-semibold">Revenue — Last 7 Days</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-4">
          {loading ? (
            <Skeleton className="h-48 w-full rounded-lg" />
          ) : chartData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`}
                  width={48}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }} />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* ── Today's Shows + Recent Bookings ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Today's Shows */}
        <Card className="border-border/60">
          <CardHeader className="pb-2 pt-4 px-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-sky-500/10">
                  <Film className="w-4 h-4 text-sky-500" />
                </div>
                <CardTitle className="text-base font-semibold">Today's Shows</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground gap-1 hover:text-foreground"
                onClick={() => navigate('/showtimes')}
              >
                View all <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            {loading ? (
              <div className="space-y-2.5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            ) : todayShows.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-muted-foreground gap-2">
                <Film className="w-8 h-8 opacity-30" />
                <p className="text-sm">No shows scheduled for today</p>
              </div>
            ) : (
              <div className="space-y-2">
                {todayShows.map(show => {
                  const pct = show.total_seats ? show.booked_seats / show.total_seats : 0
                  return (
                    <div
                      key={show.id}
                      className={`flex items-center justify-between rounded-lg px-3 py-2.5 ${occupancyBg(show.booked_seats, show.total_seats)}`}
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-sm leading-tight truncate">{show.movie_title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {show.start_time?.slice(0, 5)}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Monitor className="w-3 h-3" />
                            {show.screen_name}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <p className={`text-sm font-semibold ${occupancyColor(show.booked_seats, show.total_seats)}`}>
                          {show.booked_seats}/{show.total_seats}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {show.total_seats ? Math.round(pct * 100) : 0}% full
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Bookings */}
        <Card className="border-border/60">
          <CardHeader className="pb-2 pt-4 px-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-primary/10">
                  <Ticket className="w-4 h-4 text-primary" />
                </div>
                <CardTitle className="text-base font-semibold">Recent Bookings</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground gap-1 hover:text-foreground"
                onClick={() => navigate('/bookings')}
              >
                View all <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            {loading ? (
              <div className="space-y-2.5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            ) : recentBookings.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-muted-foreground gap-2">
                <Ticket className="w-8 h-8 opacity-30" />
                <p className="text-sm">No bookings yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentBookings.map(b => {
                  const sc = statusConfig[b.booking_status]
                  return (
                    <div
                      key={b.id}
                      className="flex items-center justify-between rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors px-3 py-2.5 cursor-pointer"
                      onClick={() => navigate(`/bookings/${b.id}`)}
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-sm leading-tight truncate">
                          {b.customer_name || '—'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{b.movie_title}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <span className="text-sm font-semibold">{fmtRupee(b.total_amount)}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${sc?.className || 'bg-muted text-muted-foreground'}`}>
                          {sc?.label || b.booking_status}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  )
}

export default HomePage
