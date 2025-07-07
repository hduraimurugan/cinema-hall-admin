import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Users, ArrowLeft } from "lucide-react"
import { showsAPI } from "../services/api"
import { LazyLoadImage } from "react-lazy-load-image-component"
import "react-lazy-load-image-component/src/effects/blur.css"

const ShowPage = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [showData, setShowData] = useState(null)
    const [selectedSeats, setSelectedSeats] = useState([])
    const [loading, setLoading] = useState(true)

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
        if (id) {
            fetchShowData()
        }
    }, [id])

    const handleSeatClick = (seat) => {
        if (seat.status !== "available") return
        setSelectedSeats((prev) => {
            const isSelected = prev.find((s) => s.id === seat.id)
            if (isSelected) {
                return prev.filter((s) => s.id !== seat.id)
            } else {
                return [...prev, seat]
            }
        })
    }

    const getSeatColor = (seat) => {
        const isSelected = selectedSeats.find((s) => s.id === seat.id)

        if (seat.type === "passage" || seat.isBlocked || seat.status === "blocked") {
            return "invisible"
        }

        if (seat.status === "booked") {
            return "bg-gray-300 text-gray-500 cursor-not-allowed"
        }

        if (seat.status === "in_booking") {
            return "bg-gray-300 text-gray-500 cursor-not-allowed"
        }

        if (isSelected) {
            return "bg-green-500 border-green-600 text-white shadow-lg"
        }

        // Available seats - green border with white background
        return "bg-primary-background border-2 border-green-400 hover:border-green-500 cursor-pointer"
    }

    const getTotalPrice = () => {
        return selectedSeats.reduce((total, seat) => {
            const overridePrice = showData?.show_details?.price_override?.[seat.type]
            return total + (overridePrice ? Number.parseInt(overridePrice) : seat.price)
        }, 0)
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
                        <div key={row} className="flex items-center justify-center gap-1">
                            <div className="w-8 text-center text-sm font-medium mr-2">{row}</div>
                            {seatsByRow[row]
                                .sort((a, b) => {
                                    const aNum = Number.parseInt(a.seat_label?.slice(1) || "0")
                                    const bNum = Number.parseInt(b.seat_label?.slice(1) || "0")
                                    return aNum - bNum
                                })
                                .map((seat, index) => (
                                    <button
                                        key={seat.id}
                                        onClick={() => handleSeatClick(seat)}
                                        disabled={seat.status !== "available"}
                                        className={`
                    w-8 h-8 text-xs font-medium rounded transition-all duration-200 transform
                    ${getSeatColor(seat)}
                    ${seat.status === "available" ? "hover:scale-105" : ""}
                    ${selectedSeats.find((s) => s.id === seat.id) ? "ring-1 ring-green-400" : ""}
                  `}
                                        title={`${seat.seat_label} - ₹${price}`}
                                    >
                                        {seat.seat_label?.slice(1) || index + 1}
                                    </button>
                                ))}
                        </div>
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
                                        <div className="w-4 h-4 bg-gray-300 border-2 border-gray-400 rounded"></div>
                                        <span className="">BOOKED</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-green-500 border-2 border-green-600 rounded"></div>
                                        <span className="">SELECTED</span>
                                    </div>
                                </div>

                                {/* Seat Layout */}
                                <div className="space-y-8">
                                    {/* Premium Seats */}
                                    {renderSeatSection(
                                        categorizedSeats.premium,
                                        "PREMIUM A (3D charges inclusive)",
                                        showData.show_details.price_override?.premium || "190",
                                    )}

                                    {/* Passage Space */}
                                    <div className="h-4"></div>

                                    {/* Gold Seats */}
                                    {renderSeatSection(
                                        categorizedSeats.gold,
                                        "GOLD (3D charges inclusive)",
                                        showData.show_details.price_override?.gold || "170",
                                    )}

                                    {/* Passage Space */}
                                    <div className="h-4"></div>

                                    {/* Silver Seats */}
                                    {renderSeatSection(
                                        categorizedSeats.silver,
                                        "SILVER (3D charges inclusive)",
                                        showData.show_details.price_override?.silver || "150",
                                    )}
                                </div>

                                {/* Screen */}
                                <div className="mt-12 mb-4">
                                    <div className="relative">
                                        <div className="h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent rounded-full mb-2"></div>
                                        <div className="text-center">
                                            <div className="inline-block bg-blue-50 px-4 py-1 rounded-full">
                                                <span className="text-xs font-medium text-blue-600 tracking-wider">SCREEN THIS WAY</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Booking Summary */}
                    <div className="lg:col-span-1">
                        <Card className="shadow-lg border-0 sticky top-32">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg font-semibold ">Booking Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {selectedSeats.length > 0 ? (
                                    <>
                                        <div>
                                            <h4 className="font-medium mb-3">Selected Seats</h4>
                                            <div className="grid grid-cols-3 gap-2">
                                                {selectedSeats.map((seat) => (
                                                    <div
                                                        key={seat.id}
                                                        className="bg-green-50 border border-green-200 rounded px-2 py-1 text-center"
                                                    >
                                                        <span className="text-xs font-medium text-green-700">{seat.seat_label}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <Separator />

                                        <div className="space-y-3">
                                            {Object.entries(
                                                selectedSeats.reduce((acc, seat) => {
                                                    const type = seat.type
                                                    const price = showData.show_details.price_override?.[type] || seat.price
                                                    if (!acc[type]) {
                                                        acc[type] = { count: 0, price: Number.parseInt(price), total: 0 }
                                                    }
                                                    acc[type].count += 1
                                                    acc[type].total += Number.parseInt(price)
                                                    return acc
                                                }, {}),
                                            ).map(([type, data]) => (
                                                <div key={type} className="flex justify-between text-sm">
                                                    <span className="capitalize">
                                                        {type} ({data.count}x)
                                                    </span>
                                                    <span className="font-medium">₹{data.total}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <Separator />

                                        <div className="flex justify-between font-bold text-lg">
                                            <span>Total</span>
                                            <span>₹{getTotalPrice()}</span>
                                        </div>

                                        <Button className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-base font-medium">
                                            Proceed to Payment
                                        </Button>
                                    </>
                                ) : (
                                    <div className="text-center py-8">
                                        <Users className="w-12 h-12 mx-auto mb-4" />
                                        <p className="text-sm">Select seats to continue</p>
                                    </div>
                                )}

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
