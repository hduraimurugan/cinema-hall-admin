import React, { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Users, ArrowLeft } from "lucide-react"
import { showsAPI, settingsAPI } from "../services/api"
import { LazyLoadImage } from "react-lazy-load-image-component"
import "react-lazy-load-image-component/src/effects/blur.css"

const ShowPage = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [showData, setShowData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [settings, setSettings] = useState({ convenience_fee_per_ticket: 15, gst_percentage: 18 })

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

    const getPrice = (type) => {
        const override = showData?.show_details?.price_override
        const layoutPricing = showData?.screen?.layout?.pricing
        return Number(override?.[type] ?? layoutPricing?.[type] ?? 0)
    }

    const formatCurrency = (amount) =>
        `₹${Math.round(amount).toLocaleString("en-IN")}`

    const getSeatColor = (seat) => {
        if (seat.type === "passage" || seat.isBlocked || seat.status === "blocked") {
            return "invisible"
        }

        if (seat.status === "booked" || seat.status === "BOOKED") {
            return "bg-red-400 text-white cursor-default"
        }

        if (seat.status === "in_booking" || seat.status === "HELD") {
            return "bg-yellow-400 text-gray-700 cursor-default"
        }

        // Available seats - green border
        return "bg-primary-background border-2 border-green-400 cursor-default"
    }

    const generateSeatsByCategory = () => {
        if (!showData?.screen?.layout?.seats) return { premium: [], gold: [], silver: [] }

        const seats = showData.screen.layout.seats
        const categorizedSeats = {
            premium: seats.filter((seat) => seat.type === "premium"),
            gold: seats.filter((seat) => seat.type === "gold"),
            silver: seats.filter((seat) => seat.type === "silver"),
        }

        return categorizedSeats
    }

    const renderSeatSection = (seats, sectionTitle, price) => {
        if (!seats.length) return null

        const aisleAfterColumns = showData?.screen?.layout?.aisleAfterColumns || []
        const aisleAfterRows = showData?.screen?.layout?.aisleAfterRows || []

        // Group seats by row
        const seatsByRow = seats.reduce((acc, seat) => {
            const row = seat.seat_label?.charAt(0) || "A"
            if (!acc[row]) acc[row] = []
            acc[row].push(seat)
            return acc
        }, {})

        const sortedRows = Object.keys(seatsByRow).sort()

        return (
            <div className="mb-8">
                <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold mb-1">{sectionTitle}</h3>
                    <p className="text-sm ">₹{price}</p>
                </div>
                <div className="space-y-2">
                    {sortedRows.map((row) => (
                        <React.Fragment key={row}>
                            <div className="flex items-center justify-center gap-1">
                                <div className="w-8 text-center text-sm font-medium mr-2">{row}</div>
                                {seatsByRow[row]
                                    .sort((a, b) => {
                                        const aNum = Number.parseInt(a.seat_label?.slice(1) || "0")
                                        const bNum = Number.parseInt(b.seat_label?.slice(1) || "0")
                                        return aNum - bNum
                                    })
                                    .map((seat, index) => {
                                        const colNum = Number.parseInt(seat.seat_label?.slice(1) || "0")
                                        const hasAisleAfterCol = aisleAfterColumns.includes(colNum)
                                        return (
                                            <React.Fragment key={seat.id}>
                                                <div
                                                    className={`
                                                        w-8 h-8 text-xs text-center flex items-center justify-center font-medium rounded transition-all duration-200
                                                        ${getSeatColor(seat)}
                                                    `}
                                                    title={`${seat.seat_label} - ₹${price} - ${seat.status?.toUpperCase() || 'AVAILABLE'}`}
                                                >
                                                    {seat.seat_label?.slice(1) || index + 1}
                                                </div>
                                                {hasAisleAfterCol && (
                                                    <div className="w-3" aria-hidden="true" />
                                                )}
                                            </React.Fragment>
                                        )
                                    })}
                            </div>
                            {aisleAfterRows.includes(row) && (
                                <div className="h-3" aria-hidden="true" />
                            )}
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
                    <p className="">Loading show details...</p>
                </div>
            </div>
        )
    }

    if (!showData) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-xl ">Show not found</p>
                </div>
            </div>
        )
    }

    const categorizedSeats = generateSeatsByCategory()

    return (
        <div className="min-h-screen">
            {/* Header */}
            <div className="bg-background shadow-sm border-b sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center gap-4 mb-4">
                        <Button variant="ghost" size="sm" className="p-2" onClick={() => navigate('/shows')}>
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                        <div className="flex gap-4 p-4 rounded-xl items-center">
                            {/* Poster */}
                            <div className="h-20 w-14 rounded-md overflow-hidden flex-shrink-0 bg-muted border border-border">
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
                            <div className="flex-1">
                                <h1 className="text-lg font-semibold  mb-1">
                                    {showData.movie.title}{" "}
                                    <span className="text-muted-foreground text-sm font-medium">
                                        • {showData.movie.language?.join(", ") || "English"}
                                    </span>
                                </h1>

                                <p className="text-sm text-muted-foreground mb-0.5">
                                    📅 {showData.show_details.show_date}
                                </p>

                                <p className="text-sm text-muted-foreground">
                                    🏟️ {showData.screen.name}
                                </p>
                            </div>
                        </div>

                    </div>

                    {/* Time Slots */}
                    <div className="flex gap-2">
                        <Button
                            variant="default"
                            size="sm"
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
                        >
                            {showData.show_details.start_time}
                            <div className="text-xs opacity-80 ml-1">{showData.screen.screen_type || "2D"}</div>
                        </Button>
                        {/* <Button variant="outline" size="sm" className="px-4 py-2 bg-transparent">
              08:45 PM
              <div className="text-xs text-gray-500 ml-1">3D</div>
            </Button> */}
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6">
                <div className="grid lg:grid-cols-4 gap-6">
                    {/* Seat Selection */}
                    <div className="lg:col-span-3">
                        <Card className="shadow-lg border-0">
                            <CardContent className="p-6">
                                {/* Legend */}
                                <div className="flex justify-center gap-6 mb-6 text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-background border-2 border-green-400 rounded"></div>
                                        <span className="">AVAILABLE</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-yellow-400 rounded"></div>
                                        <span className="">HELD</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-red-400 rounded"></div>
                                        <span className="">BOOKED</span>
                                    </div>
                                </div>

                                {(() => {
                                    const screenPosition = showData.screen?.layout?.screenPosition || "bottom"
                                    const screenIndicator = (
                                        <div className="my-6">
                                            <div className="relative">
                                                <div className="h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent rounded-full mb-2"></div>
                                                <div className="text-center">
                                                    <div className="inline-block bg-blue-50 px-4 py-1 rounded-full">
                                                        <span className="text-xs font-medium text-blue-600 tracking-wider">SCREEN THIS WAY</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                    const seatLayout = (
                                        <div className="space-y-8">
                                            {renderSeatSection(
                                                categorizedSeats.premium,
                                                "PREMIUM A (3D charges inclusive)",
                                                showData.show_details.price_override?.premium || "190",
                                            )}
                                            <div className="h-4"></div>
                                            {renderSeatSection(
                                                categorizedSeats.gold,
                                                "GOLD (3D charges inclusive)",
                                                showData.show_details.price_override?.gold || "170",
                                            )}
                                            <div className="h-4"></div>
                                            {renderSeatSection(
                                                categorizedSeats.silver,
                                                "SILVER (3D charges inclusive)",
                                                showData.show_details.price_override?.silver || "150",
                                            )}
                                        </div>
                                    )
                                    return screenPosition === "top" ? (
                                        <>{screenIndicator}{seatLayout}</>
                                    ) : (
                                        <>{seatLayout}{screenIndicator}</>
                                    )
                                })()}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Booking Summary */}
                    <div className="lg:col-span-1">
                        <Card className="shadow-lg border-0 sticky top-32">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg font-semibold">Seat Status Overview</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {(() => {
                                    const seats = showData?.screen?.layout?.seats || []
                                    const bookedSeats = seats.filter(s => s.status === "booked" || s.status === "BOOKED")
                                    const heldSeats = seats.filter(s => s.status === "in_booking" || s.status === "HELD")
                                    const availableSeats = seats.filter(s =>
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
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                                                    <span className="font-medium">Available</span>
                                                    <span className="text-lg font-bold text-green-600">{availableSeats.length}</span>
                                                </div>

                                                <div className="flex justify-between items-center p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                                                    <span className="font-medium">Held</span>
                                                    <span className="text-lg font-bold text-yellow-600">{heldSeats.length}</span>
                                                </div>

                                                <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                                                    <span className="font-medium">Booked</span>
                                                    <span className="text-lg font-bold text-red-600">{bookedSeats.length}</span>
                                                </div>
                                            </div>

                                            {bookedSeats.length > 0 && (
                                                <>
                                                    <Separator />
                                                    <div>
                                                        <h4 className="font-medium mb-3">Booked Seats</h4>
                                                        <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                                                            {bookedSeats.map((seat) => (
                                                                <div
                                                                    key={seat.id}
                                                                    className="bg-red-50 dark:bg-red-950 border border-red-200 rounded px-2 py-1 text-center"
                                                                >
                                                                    <span className="text-xs font-medium text-red-700 dark:text-red-400">{seat.seat_label}</span>
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
                                            <h4 className="font-medium mb-3">Revenue Breakdown</h4>
                                            <div className="space-y-2 text-sm">
                                                {categories.map((type) => {
                                                    const count = bookedByCategory[type].length
                                                    if (!count) return null
                                                    const price = getPrice(type)
                                                    return (
                                                        <div key={type} className="flex justify-between items-center">
                                                            <span className="text-muted-foreground capitalize">
                                                                {type} ({count} × ₹{price.toLocaleString("en-IN")})
                                                            </span>
                                                            <span className="font-medium">{formatCurrency(count * price)}</span>
                                                        </div>
                                                    )
                                                })}

                                                <div className="flex justify-between items-center pt-1 border-t border-dashed">
                                                    <span className="text-muted-foreground">Ticket Revenue</span>
                                                    <span className="font-medium">{formatCurrency(ticketRevenue)}</span>
                                                </div>

                                                <div className="flex justify-between items-center">
                                                    <span className="text-muted-foreground">
                                                        Conv. Fee (₹{settings.convenience_fee_per_ticket} × {totalBooked})
                                                    </span>
                                                    <span className="font-medium">{formatCurrency(convFee)}</span>
                                                </div>

                                                <div className="flex justify-between items-center">
                                                    <span className="text-muted-foreground">
                                                        GST ({settings.gst_percentage}% on conv.)
                                                    </span>
                                                    <span className="font-medium">{formatCurrency(gst)}</span>
                                                </div>

                                                <Separator />

                                                <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                                                    <span className="font-semibold text-green-700 dark:text-green-400">Total Revenue</span>
                                                    <span className="text-lg font-bold text-green-600">{formatCurrency(grandTotal)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })()}

                                <Separator />

                                <div className="text-xs space-y-1 p-3 rounded-lg">
                                    <p>• Please arrive 15 minutes before showtime</p>
                                    <p>• Outside food and beverages are not allowed</p>
                                    <p>• Tickets once booked cannot be cancelled</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ShowPage
