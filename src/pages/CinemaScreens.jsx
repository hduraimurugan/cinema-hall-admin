import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Monitor, Edit, Trash2, Eye, Plus, Loader2 } from 'lucide-react'
import { screensAPI } from "../services/api.js"

const CinemaScreenDesigner = () => {
  const navigate = useNavigate()
  const [screens, setScreens] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [screenToDelete, setScreenToDelete] = useState(null)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [viewingScreen, setViewingScreen] = useState(null)

  useEffect(() => {
    fetchScreens()
  }, [])

  const fetchScreens = async () => {
    try {
      setLoading(true)
      setError("")
      const data = await screensAPI.getMyScreens()
      setScreens(data || [])
    } catch (err) {
      setError(err.message || "Failed to fetch screens")
      console.error("Error fetching screens:", err)
    } finally {
      setLoading(false)
    }
  }

  const deleteScreen = (screen) => {
    setScreenToDelete(screen)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    try {
      setLoading(true)
      setError("")
      await screensAPI.deleteScreen(screenToDelete.id)
      await fetchScreens()
      setShowDeleteDialog(false)
      setScreenToDelete(null)
    } catch (err) {
      setError(err.message || "Failed to delete screen")
    } finally {
      setLoading(false)
    }
  }

  const viewScreen = (screen) => {
    setViewingScreen(screen)
    setShowViewDialog(true)
  }

  return (
    <div className="container mx-auto p-7 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="md:text-4xl text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Cinema Screens
          </h1>
          <p className="text-muted-foreground mt-2">Manage your cinema screen layouts with professional tools</p>
        </div>
        <Button
          onClick={() => navigate('/screens/new')}
          className="bg-primary text-primary-foreground"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          Add Screen
        </Button>
      </div>

      {error && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
            <Button variant="outline" onClick={fetchScreens} className="mt-2">
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {loading && screens.length === 0 ? (
        <Card className="border-0 shadow-xl overflow-hidden">
          <CardContent className="py-20">
            <div className="flex flex-col items-center">
              {/* Custom Cinema Loader Animation */}
              <div className="relative mb-8">
                {/* Outer rotating ring */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-32 w-32 rounded-full border-4 border-transparent border-t-primary border-r-primary/50 animate-spin"
                       style={{ animationDuration: '3s' }} />
                </div>

                {/* Middle pulsing ring */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-24 w-24 rounded-full bg-gradient-to-r from-primary/20 to-primary/5 animate-pulse" />
                </div>

                {/* Inner content - animated screen seats */}
                <div className="relative h-32 w-32 flex items-center justify-center">
                  <div className="space-y-2">
                    {/* Animated seat rows */}
                    <div className="flex gap-1 justify-center animate-pulse" style={{ animationDelay: '0s' }}>
                      <div className="h-2 w-2 rounded-sm bg-seat-premium" />
                      <div className="h-2 w-2 rounded-sm bg-seat-premium" />
                      <div className="h-2 w-2 rounded-sm bg-seat-premium" />
                    </div>
                    <div className="flex gap-1 justify-center animate-pulse" style={{ animationDelay: '0.2s' }}>
                      <div className="h-2 w-2 rounded-sm bg-seat-gold" />
                      <div className="h-2 w-2 rounded-sm bg-seat-gold" />
                      <div className="h-2 w-2 rounded-sm bg-seat-gold" />
                    </div>
                    <div className="flex gap-1 justify-center animate-pulse" style={{ animationDelay: '0.4s' }}>
                      <div className="h-2 w-2 rounded-sm bg-seat-silver" />
                      <div className="h-2 w-2 rounded-sm bg-seat-silver" />
                      <div className="h-2 w-2 rounded-sm bg-seat-silver" />
                    </div>
                    {/* Mini screen indicator */}
                    <div className="flex justify-center mt-3">
                      <div className="h-1 w-8 rounded-full bg-gradient-to-r from-primary to-primary/60 animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>

              <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Loading Screens
              </h3>
              <p className="text-slate-600 dark:text-slate-400 font-medium">
                Please wait while we fetch your cinema screens...
              </p>
            </div>
          </CardContent>
        </Card>
      ) : screens.length === 0 ? (
        <Card className="border-0 shadow-2xl overflow-hidden">
          <CardContent className="relative py-20">
            <div className="flex flex-col items-center max-w-md mx-auto">
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/60 rounded-full blur-2xl opacity-20 animate-pulse" />
                <div className="relative bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/15 dark:to-primary/5 p-6 rounded-2xl shadow-lg">
                  <Monitor className="h-20 w-20 text-primary" />
                </div>
              </div>

              <h3 className="text-3xl font-bold mb-3 text-center bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                No Screens Created Yet
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-8 text-center leading-relaxed">
                Get started by creating your first cinema screen layout. Define rows, seats, and pricing to manage your cinema efficiently.
              </p>

              <Button
                onClick={() => navigate('/screens/new')}
                size="lg"
                className="bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 group"
              >
                <Plus className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                Create Your First Screen
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {screens.map((screen, index) => (
            <Card
              key={screen.id}
              className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500  hover:scale-[1.02] cursor-pointer"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Animated gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:via-primary/3 group-hover:to-primary/5 transition-all duration-500" />

              {/* Decorative corner accent */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-primary/5 rounded-bl-full transform translate-x-16 -translate-y-16 group-hover:translate-x-12 group-hover:-translate-y-12 transition-transform duration-500" />

              <CardHeader className="relative pb-4">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 dark:from-primary/20 dark:to-primary/10 group-hover:scale-110 transition-transform duration-300">
                      <Monitor className="h-5 w-5 text-primary" />
                    </div>
                    <span className="truncate text-zinc-800 dark:text-zinc-100 font-bold text-lg group-hover:text-primary transition-colors">
                      {screen.name}
                    </span>
                  </div>
                  <Badge className="bg-primary text-primary-foreground shadow-md hover:shadow-lg transition-shadow">
                    {screen.total_seats} seats
                  </Badge>
                </CardTitle>
              </CardHeader>

              <CardContent className="relative space-y-4">
                {/* Seat type statistics with enhanced design */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-3 rounded-xl bg-seat-premium/10 border border-seat-premium/30 hover:shadow-md transition-all duration-300 hover:scale-105">
                    <div className="text-2xl font-bold text-seat-premium mb-1">{screen.premium_seats}</div>
                    <div className="text-seat-premium/80 text-xs font-semibold mb-1">Premium</div>
                    <div className="text-seat-premium text-xs font-medium bg-seat-premium/15 px-2 py-0.5 rounded-full inline-block">
                      Rs.{screen.premium_price}
                    </div>
                  </div>

                  <div className="text-center p-3 rounded-xl bg-seat-gold/10 border border-seat-gold/30 hover:shadow-md transition-all duration-300 hover:scale-105">
                    <div className="text-2xl font-bold text-seat-gold mb-1">{screen.gold_seats}</div>
                    <div className="text-seat-gold/80 text-xs font-semibold mb-1">Gold</div>
                    <div className="text-seat-gold text-xs font-medium bg-seat-gold/15 px-2 py-0.5 rounded-full inline-block">
                      Rs.{screen.gold_price}
                    </div>
                  </div>

                  <div className="text-center p-3 rounded-xl bg-seat-silver/10 border border-seat-silver/30 hover:shadow-md transition-all duration-300 hover:scale-105">
                    <div className="text-2xl font-bold text-seat-silver mb-1">{screen.silver_seats}</div>
                    <div className="text-seat-silver/80 text-xs font-semibold mb-1">Silver</div>
                    <div className="text-seat-silver text-xs font-medium bg-seat-silver/15 px-2 py-0.5 rounded-full inline-block">
                      Rs.{screen.silver_price}
                    </div>
                  </div>
                </div>

                {/* Timestamps with icons */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 text-xs space-y-1.5">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <span className="font-medium">Created:</span>
                    <span className="ml-auto">{new Date(screen.created_at).toLocaleDateString()}</span>
                  </div>
                  {screen.updated_at && (
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <span className="font-medium">Updated:</span>
                      <span className="ml-auto">{new Date(screen.updated_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                <Separator className="dark:bg-zinc-700" />

                {/* Action buttons with enhanced styling */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-primary/20 dark:border-primary/30 transition-all duration-300 group/btn"
                    onClick={() => navigate(`/screens/${screen.id}/edit`, { state: { screen } })}
                    disabled={loading}
                  >
                    <Edit className="h-4 w-4 mr-1.5 group-hover/btn:scale-110 transition-transform" />
                    <span className="font-medium">Edit</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-border transition-all duration-300 group/btn"
                    onClick={() => viewScreen(screen)}
                  >
                    <Eye className="h-4 w-4 mr-1.5 group-hover/btn:scale-110 transition-transform" />
                    <span className="font-medium">View</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-destructive/20 dark:border-destructive/30 transition-all duration-300 group/btn"
                    onClick={() => deleteScreen(screen)}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 group-hover/btn:scale-110 transition-transform" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Screen</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{screenToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={loading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete Screen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Screen Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="md:min-w-[100vh] max-h-[90vh] overflow-auto" style={{ scrollBarWidth: "none" }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-primary" />
              {viewingScreen?.name} - Seat Selection
            </DialogTitle>
            <DialogDescription>Choose your preferred seats for the best movie experience</DialogDescription>
          </DialogHeader>
          {viewingScreen && (
            <div className="space-y-6 py-4">
              {/* Screen Display */}
              {viewingScreen.layout.screenPosition === "top" && (
                <div className="flex flex-col items-center select-none my-2">
                  <div className="w-72 sm:w-80 h-4 border-t-2 border-primary/50 dark:border-primary/70 rounded-[50%/10px_10px_0_0] relative shadow-[0_-8px_24px_-4px_var(--color-primary)]">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 sm:w-56 h-24 bg-gradient-to-b from-primary/12 via-primary/3 to-transparent blur-md pointer-events-none rounded-[50%/0_0_20px_20px]" />
                  </div>
                  <p className="text-center text-[9px] font-bold tracking-[0.4em] text-primary uppercase mt-3">Screen</p>
                </div>
              )}

              {/* Seating Layout */}
              <div className="bg-card/50 border border-border/40 p-8 rounded-xl">
                <div className="flex justify-center">
                  <div className="inline-block">
                    {/* Column numbers */}
                    <div className="flex items-center gap-1 mb-4 ml-8">
                      {Array.from({ length: viewingScreen.layout.columns }, (_, colIndex) => {
                        const colNumber = colIndex + 1
                        const hasAisle = (viewingScreen.layout.aisleAfterColumns || []).includes(colNumber)
                        return (
                          <React.Fragment key={colIndex}>
                            <div className="w-9 text-center text-xs font-medium text-gray-500">
                              {colNumber}
                            </div>
                            {hasAisle && colIndex < viewingScreen.layout.columns - 1 && (
                              <div className="w-4" />
                            )}
                          </React.Fragment>
                        )
                      })}
                    </div>

                    {/* Rows with seats */}
                    {Array.from({ length: viewingScreen.layout.rows }, (_, rowIndex) => {
                      const rowLabel = String.fromCharCode(65 + rowIndex)
                      const hasAisleAfterRow = (viewingScreen.layout.aisleAfterRows || []).includes(rowLabel)
                      const rowSeats = viewingScreen.layout.seats.filter((seat) => seat.id.startsWith(`${rowIndex}-`))
                      const hasValidSeats = rowSeats.some((seat) => !seat.isBlocked && seat.type !== "entrance" && seat.type !== "door")

                      if (!hasValidSeats) return null

                      return (
                        <React.Fragment key={rowIndex}>
                          <div className="flex items-center gap-1 mb-2">
                            {/* Row label */}
                            <div className="w-6 text-center font-bold text-lg text-gray-700 dark:text-gray-300">
                              {rowLabel}
                            </div>

                            {/* Seats with column aisle spacers */}
                            {Array.from({ length: viewingScreen.layout.columns }, (_, colIndex) => {
                              const colNumber = colIndex + 1
                              const hasAisleAfterCol = (viewingScreen.layout.aisleAfterColumns || []).includes(colNumber)
                              const seat = viewingScreen.layout.seats.find((s) => s.id === `${rowIndex}-${colIndex}`)

                              const seatEl = !seat || seat.isBlocked || seat.type === "entrance" || seat.type === "door"
                                ? <div key={colIndex} className="w-9 h-9" />
                                : (() => {
                                    const seatColor =
                                      seat.type === "premium"
                                        ? "bg-seat-premium/90 border-seat-premium text-seat-premium-foreground shadow-md hover:shadow-lg hover:bg-seat-premium"
                                        : seat.type === "gold"
                                          ? "bg-seat-gold/90 border-seat-gold text-seat-gold-foreground shadow-md hover:shadow-lg hover:bg-seat-gold"
                                          : "bg-seat-silver/90 border-seat-silver text-seat-silver-foreground shadow-sm hover:shadow-md hover:bg-seat-silver"
                                    return (
                                      <button
                                        className={`w-9 h-9 rounded-t-md rounded-b-[3px] border-2 border-b-4 transition-all duration-200 hover:scale-110 active:scale-95 font-bold text-sm ${seatColor} cursor-pointer`}
                                        title={`Seat ${seat.row}${seat.column} - ${seat.type.toUpperCase()} - Rs.${seat.price}`}
                                      >
                                        {seat.column}
                                      </button>
                                    )
                                  })()

                              return (
                                <React.Fragment key={colIndex}>
                                  {seatEl}
                                  {hasAisleAfterCol && colIndex < viewingScreen.layout.columns - 1 && (
                                    <div className="w-4 flex items-center justify-center opacity-40">
                                      <div className="w-0.5 h-7 bg-muted-foreground/40 rounded" />
                                    </div>
                                  )}
                                </React.Fragment>
                              )
                            })}

                            {/* Row label (right side) */}
                            <div className="w-6 text-center font-bold text-lg text-gray-700 dark:text-gray-300">
                              {rowLabel}
                            </div>
                          </div>

                          {/* Horizontal aisle spacer */}
                          {hasAisleAfterRow && (
                            <div className="flex items-center gap-1 my-1 ml-8">
                              <div className="flex-1 h-0.5 bg-border rounded opacity-70" />
                            </div>
                          )}
                        </React.Fragment>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Screen Display Bottom */}
              {viewingScreen.layout.screenPosition === "bottom" && (
                <div className="flex flex-col items-center select-none my-2">
                  <p className="text-center text-[9px] font-bold tracking-[0.4em] text-primary uppercase mb-3">Screen</p>
                  <div className="w-72 sm:w-80 h-4 border-b-2 border-primary/50 dark:border-primary/70 rounded-[50%/0_0_10px_10px] relative shadow-[0_8px_24px_-4px_var(--color-primary)]">
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 sm:w-56 h-24 bg-gradient-to-t from-primary/12 via-primary/3 to-transparent blur-md pointer-events-none rounded-[50%/20px_20px_0_0]" />
                  </div>
                </div>
              )}

              {/* Legend and Pricing */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Seat Types</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-seat-premium/10 border border-seat-premium/25">
                      <div className="w-6 h-6 rounded-t-[4px] rounded-b-[2px] border-2 border-b-[3px] bg-seat-premium/90 border-seat-premium"></div>
                      <span className="font-medium text-sm">Premium</span>
                      <Badge className="ml-auto bg-seat-premium/20 text-seat-premium border-none">Rs.{viewingScreen.premium_price}</Badge>
                    </div>
                    <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-seat-gold/10 border border-seat-gold/25">
                      <div className="w-6 h-6 rounded-t-[4px] rounded-b-[2px] border-2 border-b-[3px] bg-seat-gold/90 border-seat-gold"></div>
                      <span className="font-medium text-sm">Gold</span>
                      <Badge className="ml-auto bg-seat-gold/20 text-seat-gold border-none">Rs.{viewingScreen.gold_price}</Badge>
                    </div>
                    <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-seat-silver/10 border border-seat-silver/25">
                      <div className="w-6 h-6 rounded-t-[4px] rounded-b-[2px] border-2 border-b-[3px] bg-seat-silver/90 border-seat-silver"></div>
                      <span className="font-medium text-sm">Silver</span>
                      <Badge className="ml-auto bg-seat-silver/20 text-seat-silver border-none">Rs.{viewingScreen.silver_price}</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Screen Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Seats:</span>
                      <span className="font-bold">{viewingScreen.total_seats}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Premium Seats:</span>
                      <span className="font-bold text-seat-premium">{viewingScreen.premium_seats}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Gold Seats:</span>
                      <span className="font-bold text-seat-gold">{viewingScreen.gold_seats}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Silver Seats:</span>
                      <span className="font-bold text-seat-silver">{viewingScreen.silver_seats}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CinemaScreenDesigner
