import React, { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  ArrowLeft, BookOpen, RotateCcw, XCircle, Play,
  Hand, MousePointer2, ZoomIn, ZoomOut,
  Calendar, Monitor, CheckCircle2, Clock, TrendingUp,
} from "lucide-react"
import { showsAPI, settingsAPI } from "../services/api"
import { LazyLoadImage } from "react-lazy-load-image-component"
import "react-lazy-load-image-component/src/effects/blur.css"
import { toast } from "sonner"

const STATUS_CONFIG = {
    scheduled:       { label: "Scheduled",    color: "bg-muted text-muted-foreground border-border" },
    booking_started: { label: "Booking Open", color: "bg-green-100 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-400 dark:border-green-700" },
    in_progress:     { label: "In Progress",  color: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-700" },
    show_ended:      { label: "Show Ended",   color: "bg-muted text-muted-foreground border-border" },
    cancelled:       { label: "Cancelled",    color: "bg-red-100 text-red-600 border-red-300 dark:bg-red-950 dark:text-red-400 dark:border-red-700" },
}

const MINIMAP_W = 300
const MINIMAP_H = 200
const SEAT_W_PX = 28
const SEAT_H_PX = 28

const formatTime = (timeString) => {
    if (!timeString) return ""
    const [hours, minutes] = timeString.split(":")
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
}

const ShowPage = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [showData, setShowData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [settings, setSettings] = useState({ convenience_fee_per_ticket: 15, gst_percentage: 18 })
    const [confirmDialog, setConfirmDialog] = useState(null)

    // Seat layout view state
    const [zoom, setZoom] = useState(1)
    const [isPanMode, setIsPanMode] = useState(false)
    const [isDraggingActive, setIsDraggingActive] = useState(false)
    const [isOverflowing, setIsOverflowing] = useState(false)
    const MIN_ZOOM = 0.5
    const MAX_ZOOM = 1.5
    const ZOOM_STEP = 0.1

    const scrollContainerRef = useRef(null)
    const contentDivRef = useRef(null)
    const minimapCanvasRef = useRef(null)
    const isDraggingRef = useRef(false)
    const dragStartXRef = useRef(0)
    const dragStartScrollLeftRef = useRef(0)
    const isMinimapDraggingRef = useRef(false)

    const openConfirm = (opts) => setConfirmDialog(opts)
    const closeConfirm = () => setConfirmDialog(null)

    useEffect(() => {
        const fetchShowData = async () => {
            try {
                const data = await showsAPI.getShowById(id)
                setShowData(data)
            } catch (error) {
                console.error("Error fetching show data:", error)
            } finally {
                setLoading(false)
            }
        }
        const fetchSettings = async () => {
            try {
                const data = await settingsAPI.getSettings()
                setSettings({
                    convenience_fee_per_ticket: Number(data.convenience_fee_per_ticket ?? 15),
                    gst_percentage: Number(data.gst_percentage ?? 18),
                })
            } catch {
                // fall back to defaults
            }
        }
        if (id) {
            fetchShowData()
            fetchSettings()
        }
    }, [id])

    const handleOpenBooking = async () => {
        try {
            await showsAPI.updateBookingStatus(id, "open")
            toast.success("Booking opened for this show")
            setShowData(prev => ({ ...prev, show_details: { ...prev.show_details, status: "booking_started" } }))
        } catch (err) {
            toast.error(err.message || "Failed to open booking")
        }
    }

    const handleRevertBooking = () => {
        openConfirm({
            title: "Revert to Scheduled",
            description: "Are you sure you want to revert this show back to Scheduled? This will close bookings and no new bookings can be made until you reopen.",
            actionLabel: "Revert",
            onConfirm: async () => {
                try {
                    await showsAPI.updateBookingStatus(id, "revert")
                    toast.success("Show reverted to Scheduled")
                    setShowData(prev => ({ ...prev, show_details: { ...prev.show_details, status: "scheduled" } }))
                } catch (err) {
                    toast.error(err.message || "Failed to revert show")
                }
            },
        })
    }

    const handleCancelShow = async () => {
        let bookingInfo = { booking_count: 0, total_amount: 0 }
        try {
            bookingInfo = await showsAPI.getShowBookingCount(id)
        } catch {
            // proceed with default — don't block the cancel dialog
        }

        const hasBookings = bookingInfo.booking_count > 0
        const description = hasBookings
            ? `⚠ This show has ${bookingInfo.booking_count} confirmed booking${bookingInfo.booking_count !== 1 ? "s" : ""}. Refunds totalling ₹${bookingInfo.total_amount.toFixed(2)} will be initiated for all customers.`
            : "No confirmed bookings for this show. The show will be cancelled."

        openConfirm({
            title: "Cancel Show",
            description,
            actionLabel: "Cancel Show",
            onConfirm: async () => {
                try {
                    const result = await showsAPI.cancelShow(id)
                    toast.success(`Show cancelled. ${result.bookings_cancelled} booking(s) cancelled.`)
                    setShowData(prev => ({ ...prev, show_details: { ...prev.show_details, status: "cancelled" } }))
                } catch (err) {
                    toast.error(err.message || "Failed to cancel show")
                }
            },
        })
    }

    const getPrice = (type) => {
        const override = showData?.show_details?.price_override
        const layoutPricing = showData?.screen?.layout?.pricing
        return Number(override?.[type] ?? layoutPricing?.[type] ?? 0)
    }

    const formatCurrency = (amount) =>
        `₹${Math.round(amount).toLocaleString("en-IN")}`

    const getSeatClasses = (seat) => {
        if (seat.type === "passage" || seat.isBlocked || seat.status === "blocked") {
            return "invisible pointer-events-none"
        }
        if (seat.status === "booked" || seat.status === "BOOKED") {
            return "bg-red-500 text-white border border-red-500"
        }
        if (seat.status === "in_booking" || seat.status === "HELD") {
            return "bg-amber-400 text-amber-900 border border-amber-400"
        }
        return "bg-transparent border border-gray-300 dark:border-zinc-600 text-gray-400 dark:text-zinc-500"
    }

    const generateSeatsByCategory = () => {
        if (!showData?.screen?.layout?.seats) return { premium: [], gold: [], silver: [] }
        const seats = showData.screen.layout.seats
        return {
            premium: seats.filter((seat) => seat.type === "premium"),
            gold: seats.filter((seat) => seat.type === "gold"),
            silver: seats.filter((seat) => seat.type === "silver"),
        }
    }

    // Build Map<seatId, {x, y}> for minimap rendering — mirrors renderSeatSection layout math
    const seatPositionMap = useMemo(() => {
        if (!showData?.screen?.layout?.seats) return new Map()
        const map = new Map()
        const seats = showData.screen.layout.seats
        const aisleAfterColumns = showData.screen.layout.aisleAfterColumns || []
        const aisleAfterRows = showData.screen.layout.aisleAfterRows || []

        const SEAT_W = 28, SEAT_GAP = 4, ROW_LABEL_W = 28
        const AISLE_COL_W = 16, AISLE_ROW_H = 12, ROW_H = 34
        const SECTION_TITLE_H = 40, SECTION_MB = 40
        const PAD_X = 32

        let yOffset = 0
        ;["premium", "gold", "silver"].forEach((type) => {
            const sectionSeats = seats.filter((s) => s.type === type)
            if (!sectionSeats.length) return
            yOffset += SECTION_TITLE_H
            const byRow = {}
            sectionSeats.forEach((seat) => {
                const row = seat.seat_label?.charAt(0) || "A"
                if (!byRow[row]) byRow[row] = []
                byRow[row].push(seat)
            })
            Object.keys(byRow).sort().forEach((row) => {
                const rowSeats = byRow[row].sort(
                    (a, b) => parseInt(a.seat_label?.slice(1) || "0") - parseInt(b.seat_label?.slice(1) || "0")
                )
                let xOffset = PAD_X + ROW_LABEL_W + SEAT_GAP
                rowSeats.forEach((seat) => {
                    map.set(seat.id, { x: xOffset, y: yOffset })
                    const colNum = parseInt(seat.seat_label?.slice(1) || "0")
                    xOffset += SEAT_W + SEAT_GAP
                    if (aisleAfterColumns.includes(colNum)) xOffset += AISLE_COL_W
                })
                yOffset += ROW_H
                if (aisleAfterRows.includes(row)) yOffset += AISLE_ROW_H
            })
            yOffset += SECTION_MB
        })
        return map
    }, [showData])

    const drawMinimap = useCallback(() => {
        const canvas = minimapCanvasRef.current
        const scrollEl = scrollContainerRef.current
        const contentEl = contentDivRef.current
        if (!canvas || !scrollEl || !contentEl || !showData) return

        const dpr = window.devicePixelRatio || 1
        const ctx = canvas.getContext("2d")
        const contentW = contentEl.scrollWidth
        const contentH = contentEl.scrollHeight
        const scaleX = MINIMAP_W / contentW
        const scaleY = MINIMAP_H / contentH

        ctx.save()
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        const isDark = document.documentElement.classList.contains("dark")
        ctx.fillStyle = isDark ? "#18181b" : "#f4f4f5"
        ctx.fillRect(0, 0, MINIMAP_W, MINIMAP_H)

        const allSeats = showData.screen?.layout?.seats || []
        allSeats.forEach((seat) => {
            if (seat.type === "passage" || seat.isBlocked || seat.status === "blocked") return
            const pos = seatPositionMap.get(seat.id)
            if (!pos) return
            const mx = pos.x * scaleX
            const my = pos.y * scaleY
            const mw = Math.max(SEAT_W_PX * scaleX, 1.5)
            const mh = Math.max(SEAT_H_PX * scaleY, 1.5)
            if (seat.status === "booked" || seat.status === "BOOKED") {
                ctx.fillStyle = "#ef4444"
            } else if (seat.status === "in_booking" || seat.status === "HELD") {
                ctx.fillStyle = "#f59e0b"
            } else if (seat.type === "premium") {
                ctx.fillStyle = isDark ? "#166534" : "#86efac"
            } else if (seat.type === "gold") {
                ctx.fillStyle = isDark ? "#14532d" : "#4ade80"
            } else {
                ctx.fillStyle = isDark ? "#15803d" : "#bbf7d0"
            }
            ctx.fillRect(mx, my, mw, mh)
        })

        const vpLeft = scrollEl.scrollLeft * scaleX
        const vpTop = scrollEl.scrollTop * scaleY
        const vpW = scrollEl.clientWidth * scaleX
        const vpH = scrollEl.clientHeight * scaleY
        ctx.fillStyle = "rgba(147, 197, 253, 0.15)"
        ctx.fillRect(vpLeft, vpTop, vpW, vpH)
        ctx.strokeStyle = "rgba(147, 197, 253, 0.85)"
        ctx.lineWidth = 1.5
        ctx.strokeRect(vpLeft, vpTop, vpW, vpH)
        ctx.restore()
    }, [showData, seatPositionMap])

    const togglePanMode = useCallback(() => {
        setIsPanMode((prev) => {
            if (prev) { isDraggingRef.current = false; setIsDraggingActive(false) }
            return !prev
        })
    }, [])

    const handlePanMouseDown = useCallback((e) => {
        if (!isPanMode || e.button !== 0) return
        isDraggingRef.current = true
        dragStartXRef.current = e.clientX
        dragStartScrollLeftRef.current = scrollContainerRef.current?.scrollLeft || 0
        setIsDraggingActive(true)
        e.preventDefault()
    }, [isPanMode])

    const handlePanMouseMove = useCallback((e) => {
        if (!isDraggingRef.current) return
        const dx = e.clientX - dragStartXRef.current
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollLeft = dragStartScrollLeftRef.current - dx
        }
        drawMinimap()
    }, [drawMinimap])

    const handlePanMouseUp = useCallback(() => {
        isDraggingRef.current = false
        setIsDraggingActive(false)
    }, [])

    const handleMinimapInteraction = useCallback((e, smooth = true) => {
        const canvas = minimapCanvasRef.current
        const scrollEl = scrollContainerRef.current
        const contentEl = contentDivRef.current
        if (!canvas || !scrollEl || !contentEl) return
        const rect = canvas.getBoundingClientRect()
        const clickX = e.clientX - rect.left
        const clickY = e.clientY - rect.top
        const scaleX = MINIMAP_W / contentEl.scrollWidth
        const scaleY = MINIMAP_H / contentEl.scrollHeight
        scrollEl.scrollTo({
            left: Math.max(0, clickX / scaleX - scrollEl.clientWidth / 2),
            top: Math.max(0, clickY / scaleY - scrollEl.clientHeight / 2),
            behavior: smooth ? "smooth" : "instant",
        })
    }, [])

    const handleMinimapMouseDown = useCallback((e) => {
        isMinimapDraggingRef.current = true
        handleMinimapInteraction(e, false)
    }, [handleMinimapInteraction])

    const handleMinimapMouseMove = useCallback((e) => {
        if (!isMinimapDraggingRef.current) return
        handleMinimapInteraction(e, false)
    }, [handleMinimapInteraction])

    const handleMinimapMouseUp = useCallback(() => { isMinimapDraggingRef.current = false }, [])

    // HiDPI canvas setup
    useEffect(() => {
        if (!isOverflowing) return
        const canvas = minimapCanvasRef.current
        if (!canvas) return
        const dpr = window.devicePixelRatio || 1
        canvas.width = MINIMAP_W * dpr
        canvas.height = MINIMAP_H * dpr
        canvas.style.width = `${MINIMAP_W}px`
        canvas.style.height = `${MINIMAP_H}px`
    }, [isOverflowing])

    // Overflow detection
    useEffect(() => {
        const scrollEl = scrollContainerRef.current
        if (!scrollEl) return
        const check = () => setIsOverflowing(scrollEl.scrollWidth > scrollEl.clientWidth)
        check()
        const observer = new ResizeObserver(check)
        observer.observe(scrollEl)
        return () => observer.disconnect()
    }, [showData])

    // Attach pan listeners while pan mode active
    useEffect(() => {
        if (!isPanMode) return
        document.addEventListener("mousemove", handlePanMouseMove)
        document.addEventListener("mouseup", handlePanMouseUp)
        return () => {
            document.removeEventListener("mousemove", handlePanMouseMove)
            document.removeEventListener("mouseup", handlePanMouseUp)
        }
    }, [isPanMode, handlePanMouseMove, handlePanMouseUp])

    // Redraw minimap on scroll
    useEffect(() => {
        const scrollEl = scrollContainerRef.current
        if (!scrollEl || !isOverflowing) return
        scrollEl.addEventListener("scroll", drawMinimap, { passive: true })
        return () => scrollEl.removeEventListener("scroll", drawMinimap)
    }, [isOverflowing, drawMinimap])

    // Redraw minimap when data or zoom changes
    useEffect(() => {
        if (!isOverflowing) return
        const raf = requestAnimationFrame(() => drawMinimap())
        return () => cancelAnimationFrame(raf)
    }, [showData, isOverflowing, zoom, drawMinimap])

    // Recheck overflow when zoom changes
    useEffect(() => {
        const scrollEl = scrollContainerRef.current
        if (!scrollEl) return
        setIsOverflowing(scrollEl.scrollWidth > scrollEl.clientWidth)
    }, [zoom])

    const renderSeatSection = (seats, sectionTitle, price) => {
        if (!seats.length) return null

        const aisleAfterColumns = showData?.screen?.layout?.aisleAfterColumns || []
        const aisleAfterRows = showData?.screen?.layout?.aisleAfterRows || []

        const seatsByRow = seats.reduce((acc, seat) => {
            const row = seat.seat_label?.charAt(0) || "A"
            if (!acc[row]) acc[row] = []
            acc[row].push(seat)
            return acc
        }, {})

        const sortedRows = Object.keys(seatsByRow).sort()

        return (
            <div className="mb-10">
                <div className="text-center mb-4">
                    <span className="text-[11px] font-semibold text-gray-500 dark:text-zinc-400 tracking-widest uppercase">
                        ₹{price} · {sectionTitle}
                    </span>
                </div>
                <div className="space-y-1.5">
                    {sortedRows.map((row) => (
                        <React.Fragment key={row}>
                            <div className="flex items-center gap-1">
                                <div className="w-5 text-center text-[10px] text-gray-400 dark:text-zinc-500 flex-shrink-0 select-none">{row}</div>
                                {seatsByRow[row]
                                    .sort((a, b) => {
                                        const aNum = parseInt(a.seat_label?.slice(1) || "0")
                                        const bNum = parseInt(b.seat_label?.slice(1) || "0")
                                        return aNum - bNum
                                    })
                                    .map((seat) => {
                                        const colNum = parseInt(seat.seat_label?.slice(1) || "0")
                                        const hasAisleAfter = aisleAfterColumns.includes(colNum)
                                        const colLabel = String(colNum).padStart(2, "0")
                                        return (
                                            <React.Fragment key={seat.id}>
                                                <div
                                                    className={`w-7 h-7 text-[10px] font-medium rounded-sm flex items-center justify-center flex-shrink-0 ${getSeatClasses(seat)}`}
                                                    title={`${seat.seat_label} — ₹${price} — ${seat.status?.toUpperCase() || "AVAILABLE"}`}
                                                >
                                                    {colLabel}
                                                </div>
                                                {hasAisleAfter && <div className="w-3 sm:w-4 flex-shrink-0" aria-hidden="true" />}
                                            </React.Fragment>
                                        )
                                    })}
                                <div className="w-5 text-center text-[10px] text-gray-400 dark:text-zinc-500 flex-shrink-0 select-none">{row}</div>
                            </div>
                            {aisleAfterRows.includes(row) && <div className="h-3" aria-hidden="true" />}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                    <p className="text-sm text-muted-foreground">Loading show details...</p>
                </div>
            </div>
        )
    }

    if (!showData) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-xl text-muted-foreground">Show not found</p>
                </div>
            </div>
        )
    }

    const categorizedSeats = generateSeatsByCategory()
    const screenPosition = showData.screen?.layout?.screenPosition || "bottom"
    const statusCfg = STATUS_CONFIG[showData.show_details.status] || STATUS_CONFIG.scheduled

    const screenIndicator = (
        <div className="my-8 px-4">
            <div className="h-[2px] bg-gradient-to-r from-transparent via-blue-400 to-transparent rounded-full" />
            <p className="text-center text-[10px] font-semibold tracking-[0.3em] text-blue-500 dark:text-blue-400 uppercase mt-2">
                All Eyes This Way
            </p>
        </div>
    )

    const seatLayout = (
        <div>
            {renderSeatSection(categorizedSeats.premium, "Premium", getPrice("premium"))}
            {renderSeatSection(categorizedSeats.gold, "Gold", getPrice("gold"))}
            {renderSeatSection(categorizedSeats.silver, "Silver", getPrice("silver"))}
        </div>
    )

    return (
        <>
            <div className="min-h-screen">
                {/* ─── Sticky Header ─── */}
                <div className="bg-background shadow-sm border-b sticky top-0 z-50">
                    <div className="container mx-auto px-4 py-3">
                        <div className="flex items-center gap-3">
                            {/* Back */}
                            <Button variant="ghost" size="sm" className="p-2 flex-shrink-0" onClick={() => navigate("/shows")}>
                                <ArrowLeft className="w-4 h-4" />
                            </Button>

                            {/* Poster */}
                            <div className="h-14 w-10 rounded overflow-hidden flex-shrink-0 bg-muted border border-border">
                                {showData.movie.poster_url ? (
                                    <LazyLoadImage
                                        src={showData.movie.poster_url}
                                        alt={showData.movie.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                        <Play className="h-4 w-4" />
                                    </div>
                                )}
                            </div>

                            {/* Movie Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                    <h1 className="text-base font-semibold leading-tight truncate">
                                        {showData.movie.title}
                                        <span className="text-muted-foreground text-sm font-normal ml-1.5">
                                            ({showData.movie.language?.join(", ") || "English"})
                                        </span>
                                    </h1>
                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded border flex-shrink-0 ${statusCfg.color}`}>
                                        {statusCfg.label}
                                    </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-2.5 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {showData.show_details.show_date}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Monitor className="w-3 h-3" />
                                        {showData.screen.name}
                                    </span>
                                    <span className="bg-blue-600 text-white text-[11px] px-2 py-0.5 rounded font-medium">
                                        {formatTime(showData.show_details.start_time)}
                                    </span>
                                    <span className="text-[11px] border border-border rounded px-1.5 py-0.5">
                                        {showData.screen.screen_type || "2D"}
                                    </span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2 flex-shrink-0">
                                {showData.show_details.status === "scheduled" && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="gap-1.5 border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/40"
                                        onClick={handleOpenBooking}
                                    >
                                        <BookOpen className="h-3.5 w-3.5" />
                                        Open Booking
                                    </Button>
                                )}
                                {showData.show_details.status === "booking_started" && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="gap-1.5 border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                                        onClick={handleRevertBooking}
                                    >
                                        <RotateCcw className="h-3.5 w-3.5" />
                                        Revert
                                    </Button>
                                )}
                                {(showData.show_details.status === "scheduled" || showData.show_details.status === "booking_started") && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="gap-1.5 border-red-400 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
                                        onClick={handleCancelShow}
                                    >
                                        <XCircle className="h-3.5 w-3.5" />
                                        Cancel
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="container mx-auto px-4 py-6">
                    <div className="grid lg:grid-cols-4 gap-6">

                        {/* ─── Seat Layout ─── */}
                        <div className="lg:col-span-3">
                            <div className="bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden">

                                {/* Legend + Pan Toggle */}
                                <div className="flex items-center justify-between px-4 sm:px-6 pt-5 pb-2">
                                    <div className="flex gap-5 sm:gap-8 text-[11px] sm:text-xs text-gray-500 dark:text-zinc-400">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-3.5 h-3.5 rounded-sm border border-gray-300 dark:border-zinc-600" />
                                            <span>Available</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-3.5 h-3.5 rounded-sm bg-amber-400" />
                                            <span>Held</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-3.5 h-3.5 rounded-sm bg-red-500" />
                                            <span>Booked</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={togglePanMode}
                                        title={isPanMode ? "Switch to view mode" : "Switch to pan mode"}
                                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-colors duration-150 flex-shrink-0 ${
                                            isPanMode
                                                ? "bg-blue-500/15 border-blue-500/50 text-blue-400"
                                                : "bg-transparent border-gray-300 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:border-gray-500 dark:hover:border-zinc-500"
                                        }`}
                                    >
                                        {isPanMode ? <Hand className="w-3.5 h-3.5" /> : <MousePointer2 className="w-3.5 h-3.5" />}
                                        <span className="hidden sm:inline">{isPanMode ? "Pan" : "Select"}</span>
                                    </button>
                                </div>

                                {/* Scroll container + Zoom controls */}
                                <div className="relative">
                                    {/* Zoom Controls */}
                                    <div className="absolute right-3 bottom-8 z-10 hidden sm:flex flex-col gap-1.5">
                                        <button
                                            onClick={() => setZoom((z) => Math.min(MAX_ZOOM, parseFloat((z + ZOOM_STEP).toFixed(1))))}
                                            disabled={zoom >= MAX_ZOOM}
                                            title="Zoom in"
                                            className="w-8 h-8 flex items-center justify-center rounded-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 shadow text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
                                        >
                                            <ZoomIn className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setZoom((z) => Math.max(MIN_ZOOM, parseFloat((z - ZOOM_STEP).toFixed(1))))}
                                            disabled={zoom <= MIN_ZOOM}
                                            title="Zoom out"
                                            className="w-8 h-8 flex items-center justify-center rounded-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 shadow text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
                                        >
                                            <ZoomOut className="w-4 h-4" />
                                        </button>
                                        <div className="text-center text-[10px] text-gray-400 dark:text-zinc-500 select-none">
                                            {Math.round(zoom * 100)}%
                                        </div>
                                    </div>

                                    {/* Seat Scroll Container */}
                                    <div
                                        ref={scrollContainerRef}
                                        className="overflow-x-auto overflow-y-visible pb-6 pt-2"
                                        style={{ cursor: isPanMode ? (isDraggingActive ? "grabbing" : "grab") : "default" }}
                                        onMouseDown={handlePanMouseDown}
                                    >
                                        <div ref={contentDivRef} className="w-max mx-auto px-4 sm:px-8" style={{ zoom }}>
                                            {screenPosition === "top" ? (
                                                <>{screenIndicator}{seatLayout}</>
                                            ) : (
                                                <>{seatLayout}{screenIndicator}</>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ─── Sidebar ─── */}
                        <div className="lg:col-span-1">
                            <Card className="shadow-sm border sticky top-[84px]">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base font-semibold">Seat Overview</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {(() => {
                                        const seats = showData?.screen?.layout?.seats || []
                                        const bookedSeats = seats.filter((s) => s.status === "booked" || s.status === "BOOKED")
                                        const heldSeats = seats.filter((s) => s.status === "in_booking" || s.status === "HELD")
                                        const availableSeats = seats.filter(
                                            (s) =>
                                                s.type !== "passage" &&
                                                !s.isBlocked &&
                                                s.status !== "blocked" &&
                                                s.status !== "booked" &&
                                                s.status !== "BOOKED" &&
                                                s.status !== "in_booking" &&
                                                s.status !== "HELD"
                                        )
                                        return (
                                            <>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-center p-2.5 bg-green-50 dark:bg-green-950/40 rounded-lg">
                                                        <div className="flex items-center gap-2">
                                                            <CheckCircle2 className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                                                            <span className="text-sm font-medium">Available</span>
                                                        </div>
                                                        <span className="text-base font-bold text-green-600 dark:text-green-400">{availableSeats.length}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center p-2.5 bg-amber-50 dark:bg-amber-950/40 rounded-lg">
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                                            <span className="text-sm font-medium">Held</span>
                                                        </div>
                                                        <span className="text-base font-bold text-amber-600 dark:text-amber-400">{heldSeats.length}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center p-2.5 bg-red-50 dark:bg-red-950/40 rounded-lg">
                                                        <div className="flex items-center gap-2">
                                                            <XCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                                                            <span className="text-sm font-medium">Booked</span>
                                                        </div>
                                                        <span className="text-base font-bold text-red-600 dark:text-red-400">{bookedSeats.length}</span>
                                                    </div>
                                                </div>

                                                {bookedSeats.length > 0 && (
                                                    <>
                                                        <Separator />
                                                        <div>
                                                            <h4 className="text-sm font-medium mb-2">Booked Seats</h4>
                                                            <div className="grid grid-cols-4 gap-1.5 max-h-48 overflow-y-auto">
                                                                {bookedSeats.map((seat) => (
                                                                    <div
                                                                        key={seat.id}
                                                                        className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded px-1 py-1 text-center"
                                                                    >
                                                                        <span className="text-[10px] font-semibold text-red-700 dark:text-red-400">{seat.seat_label}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                            </>
                                        )
                                    })()}

                                    <Separator />

                                    {/* Revenue Breakdown */}
                                    {(() => {
                                        const seats = showData?.screen?.layout?.seats || []
                                        const categories = ["premium", "gold", "silver"]
                                        const bookedByCategory = categories.reduce((acc, type) => {
                                            acc[type] = seats.filter(
                                                (s) => s.type === type && (s.status === "booked" || s.status === "BOOKED")
                                            )
                                            return acc
                                        }, {})

                                        const ticketRevenue = categories.reduce(
                                            (sum, type) => sum + bookedByCategory[type].length * getPrice(type),
                                            0
                                        )
                                        const totalBooked = categories.reduce(
                                            (sum, type) => sum + bookedByCategory[type].length,
                                            0
                                        )
                                        const convFee = totalBooked * settings.convenience_fee_per_ticket
                                        const gst = convFee * (settings.gst_percentage / 100)
                                        const grandTotal = ticketRevenue + convFee + gst

                                        return (
                                            <div>
                                                <div className="flex items-center gap-1.5 mb-3">
                                                    <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
                                                    <h4 className="text-sm font-medium">Revenue</h4>
                                                </div>
                                                <div className="space-y-1.5 text-sm">
                                                    {categories.map((type) => {
                                                        const count = bookedByCategory[type].length
                                                        if (!count) return null
                                                        const price = getPrice(type)
                                                        return (
                                                            <div key={type} className="flex justify-between items-center">
                                                                <span className="text-muted-foreground capitalize text-xs">
                                                                    {type} ({count} × ₹{price.toLocaleString("en-IN")})
                                                                </span>
                                                                <span className="font-medium text-xs">{formatCurrency(count * price)}</span>
                                                            </div>
                                                        )
                                                    })}

                                                    <div className="flex justify-between items-center pt-1 border-t border-dashed">
                                                        <span className="text-muted-foreground text-xs">Ticket Revenue</span>
                                                        <span className="font-medium text-xs">{formatCurrency(ticketRevenue)}</span>
                                                    </div>

                                                    <div className="flex justify-between items-center">
                                                        <span className="text-muted-foreground text-xs">
                                                            Conv. Fee (₹{settings.convenience_fee_per_ticket} × {totalBooked})
                                                        </span>
                                                        <span className="font-medium text-xs">{formatCurrency(convFee)}</span>
                                                    </div>

                                                    <div className="flex justify-between items-center">
                                                        <span className="text-muted-foreground text-xs">
                                                            GST ({settings.gst_percentage}% on conv.)
                                                        </span>
                                                        <span className="font-medium text-xs">{formatCurrency(gst)}</span>
                                                    </div>

                                                    <Separator />

                                                    <div className="flex justify-between items-center p-2.5 bg-green-50 dark:bg-green-950/40 rounded-lg">
                                                        <span className="font-semibold text-green-700 dark:text-green-400 text-sm">Total</span>
                                                        <span className="text-base font-bold text-green-600 dark:text-green-400">{formatCurrency(grandTotal)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })()}

                                    <Separator />

                                    <div className="text-xs space-y-1 text-muted-foreground">
                                        <p>• Arrive 15 minutes before showtime</p>
                                        <p>• Outside food &amp; beverages not allowed</p>
                                        <p>• Tickets once booked cannot be cancelled</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── Confirm Dialog ─── */}
            <AlertDialog open={!!confirmDialog} onOpenChange={(open) => { if (!open) closeConfirm() }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{confirmDialog?.title}</AlertDialogTitle>
                        <AlertDialogDescription>{confirmDialog?.description}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => { confirmDialog?.onConfirm(); closeConfirm() }}
                        >
                            {confirmDialog?.actionLabel}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

export default ShowPage

