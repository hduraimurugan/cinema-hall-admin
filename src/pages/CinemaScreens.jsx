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
          <h1 className="md:text-4xl text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Cinema Screens
          </h1>
          <p className="text-muted-foreground mt-2">Manage your cinema screen layouts with professional tools</p>
        </div>
        <Button
          onClick={() => navigate('/screens/new')}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
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
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
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
                  <div className="h-32 w-32 rounded-full border-4 border-transparent border-t-blue-500 border-r-purple-500 animate-spin"
                       style={{ animationDuration: '3s' }} />
                </div>

                {/* Middle pulsing ring */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-24 w-24 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 animate-pulse" />
                </div>

                {/* Inner content - animated screen seats */}
                <div className="relative h-32 w-32 flex items-center justify-center">
                  <div className="space-y-2">
                    {/* Animated seat rows */}
                    <div className="flex gap-1 justify-center animate-pulse" style={{ animationDelay: '0s' }}>
                      <div className="h-2 w-2 rounded-sm bg-gradient-to-br from-blue-600 to-blue-500" />
                      <div className="h-2 w-2 rounded-sm bg-gradient-to-br from-blue-600 to-blue-500" />
                      <div className="h-2 w-2 rounded-sm bg-gradient-to-br from-blue-600 to-blue-500" />
                    </div>
                    <div className="flex gap-1 justify-center animate-pulse" style={{ animationDelay: '0.2s' }}>
                      <div className="h-2 w-2 rounded-sm bg-gradient-to-br from-purple-600 to-purple-500" />
                      <div className="h-2 w-2 rounded-sm bg-gradient-to-br from-purple-600 to-purple-500" />
                      <div className="h-2 w-2 rounded-sm bg-gradient-to-br from-purple-600 to-purple-500" />
                    </div>
                    <div className="flex gap-1 justify-center animate-pulse" style={{ animationDelay: '0.4s' }}>
                      <div className="h-2 w-2 rounded-sm bg-gradient-to-br from-blue-600 to-blue-500" />
                      <div className="h-2 w-2 rounded-sm bg-gradient-to-br from-blue-600 to-blue-500" />
                      <div className="h-2 w-2 rounded-sm bg-gradient-to-br from-blue-600 to-blue-500" />
                    </div>
                    {/* Mini screen indicator */}
                    <div className="flex justify-center mt-3">
                      <div className="h-1 w-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>

              <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
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
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-2xl opacity-20 animate-pulse" />
                <div className="relative bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 p-6 rounded-2xl shadow-lg">
                  <Monitor className="h-20 w-20 text-blue-600 dark:text-blue-400" />
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
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 group"
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
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-purple-500/0 to-blue-500/0 group-hover:from-blue-500/5 group-hover:via-purple-500/5 group-hover:to-blue-500/5 transition-all duration-500" />

              {/* Decorative corner accent */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-bl-full transform translate-x-16 -translate-y-16 group-hover:translate-x-12 group-hover:-translate-y-12 transition-transform duration-500" />

              <CardHeader className="relative pb-4">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 group-hover:scale-110 transition-transform duration-300">
                      <Monitor className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="truncate text-zinc-800 dark:text-zinc-100 font-bold text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {screen.name}
                    </span>
                  </div>
                  <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md hover:shadow-lg transition-shadow">
                    {screen.total_seats} seats
                  </Badge>
                </CardTitle>
              </CardHeader>

              <CardContent className="relative space-y-4">
                {/* Seat type statistics with enhanced design */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="group/stat relative overflow-hidden text-center p-3 rounded-xl bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/40 dark:to-yellow-800/40 border border-yellow-200/50 dark:border-yellow-700/30 hover:shadow-md transition-all duration-300 hover:scale-105">
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/0 to-yellow-500/0 group-hover/stat:from-yellow-400/10 group-hover/stat:to-yellow-500/10 transition-all duration-300" />
                    <div className="relative">
                      <div className="text-2xl font-bold text-yellow-800 dark:text-yellow-200 mb-1">{screen.premium_seats}</div>
                      <div className="text-yellow-600 dark:text-yellow-300 text-xs font-semibold mb-1">Premium</div>
                      <div className="text-yellow-700 dark:text-yellow-200 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/50 px-2 py-0.5 rounded-full inline-block">
                        Rs.{screen.premium_price}
                      </div>
                    </div>
                  </div>

                  <div className="group/stat relative overflow-hidden text-center p-3 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/40 dark:to-blue-800/40 border border-blue-200/50 dark:border-blue-700/30 hover:shadow-md transition-all duration-300 hover:scale-105">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400/0 to-blue-500/0 group-hover/stat:from-blue-400/10 group-hover/stat:to-blue-500/10 transition-all duration-300" />
                    <div className="relative">
                      <div className="text-2xl font-bold text-blue-800 dark:text-blue-200 mb-1">{screen.gold_seats}</div>
                      <div className="text-blue-600 dark:text-blue-300 text-xs font-semibold mb-1">Gold</div>
                      <div className="text-blue-700 dark:text-blue-200 text-xs font-medium bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 rounded-full inline-block">
                        Rs.{screen.gold_price}
                      </div>
                    </div>
                  </div>

                  <div className="group/stat relative overflow-hidden text-center p-3 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-800/40 dark:to-zinc-700/40 border border-gray-200/50 dark:border-zinc-600/30 hover:shadow-md transition-all duration-300 hover:scale-105">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-400/0 to-gray-500/0 group-hover/stat:from-gray-400/10 group-hover/stat:to-gray-500/10 transition-all duration-300" />
                    <div className="relative">
                      <div className="text-2xl font-bold text-gray-800 dark:text-zinc-200 mb-1">{screen.silver_seats}</div>
                      <div className="text-gray-600 dark:text-zinc-400 text-xs font-semibold mb-1">Silver</div>
                      <div className="text-gray-700 dark:text-zinc-200 text-xs font-medium bg-gray-100 dark:bg-zinc-800/50 px-2 py-0.5 rounded-full inline-block">
                        Rs.{screen.silver_price}
                      </div>
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
                    className="flex-1 border-blue-200 hover:bg-gradient-to-br hover:from-blue-50 hover:to-blue-100 hover:border-blue-400 dark:border-blue-800 dark:hover:from-blue-950 dark:hover:to-blue-900 dark:hover:border-blue-600 transition-all duration-300 group/btn"
                    onClick={() => navigate(`/screens/${screen.id}/edit`, { state: { screen } })}
                    disabled={loading}
                  >
                    <Edit className="h-4 w-4 mr-1.5 group-hover/btn:scale-110 transition-transform" />
                    <span className="font-medium">Edit</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-green-200 hover:bg-gradient-to-br hover:from-green-50 hover:to-green-100 hover:border-green-400 dark:border-green-800 dark:hover:from-green-950 dark:hover:to-green-900 dark:hover:border-green-600 transition-all duration-300 group/btn"
                    onClick={() => viewScreen(screen)}
                  >
                    <Eye className="h-4 w-4 mr-1.5 group-hover/btn:scale-110 transition-transform" />
                    <span className="font-medium">View</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-200 hover:bg-gradient-to-br hover:from-red-50 hover:to-red-100 hover:border-red-400 hover:text-red-700 dark:border-red-800 dark:hover:from-red-950 dark:hover:to-red-900 dark:hover:border-red-600 dark:hover:text-red-400 transition-all duration-300 group/btn"
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
              <Monitor className="h-5 w-5 text-blue-600" />
              {viewingScreen?.name} - Seat Selection
            </DialogTitle>
            <DialogDescription>Choose your preferred seats for the best movie experience</DialogDescription>
          </DialogHeader>
          {viewingScreen && (
            <div className="space-y-6 py-4">
              {/* Screen Display */}
              {viewingScreen.layout.screenPosition === "top" && (
                <div className="flex justify-center">
                  <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white px-16 py-4 rounded-lg shadow-2xl flex items-center gap-3 transform perspective-1000 rotateX-10">
                    <Monitor className="h-6 w-6" />
                    <span className="font-bold tracking-widest text-lg">SCREEN</span>
                  </div>
                </div>
              )}

              {/* Seating Layout */}
              <div className="bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8 rounded-xl">
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
                                        ? "bg-gradient-to-br from-yellow-400 to-yellow-500 border-yellow-600 text-yellow-900 shadow-lg hover:shadow-xl"
                                        : seat.type === "gold"
                                          ? "bg-gradient-to-br from-blue-400 to-blue-500 border-blue-600 text-blue-900 shadow-lg hover:shadow-xl"
                                          : "bg-gradient-to-br from-gray-300 to-gray-400 border-gray-500 text-gray-800 shadow-md hover:shadow-lg"
                                    return (
                                      <button
                                        className={`w-9 h-9 rounded-lg border-2 transition-all duration-200 hover:scale-105 active:scale-95 font-bold text-sm ${seatColor} cursor-pointer`}
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
                                      <div className="w-0.5 h-7 bg-purple-400 rounded" />
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
                              <div className="flex-1 h-0.5 bg-purple-300 rounded opacity-50" />
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
                <div className="flex justify-center">
                  <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white px-16 py-4 rounded-lg shadow-2xl flex items-center gap-3">
                    <Monitor className="h-6 w-6" />
                    <span className="font-bold tracking-widest text-lg">SCREEN</span>
                  </div>
                </div>
              )}

              {/* Legend and Pricing */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Seat Types</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-gradient-to-br from-yellow-400 to-yellow-500 border-2 border-yellow-600"></div>
                      <span className="font-medium">Premium</span>
                      <Badge className="ml-auto">Rs.{viewingScreen.premium_price}</Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-400 to-blue-500 border-2 border-blue-600"></div>
                      <span className="font-medium">Gold</span>
                      <Badge className="ml-auto">Rs.{viewingScreen.gold_price}</Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-gradient-to-br from-gray-300 to-gray-400 border-2 border-gray-500"></div>
                      <span className="font-medium">Silver</span>
                      <Badge className="ml-auto">Rs.{viewingScreen.silver_price}</Badge>
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
                      <span className="font-bold text-yellow-600">{viewingScreen.premium_seats}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Gold Seats:</span>
                      <span className="font-bold text-blue-600">{viewingScreen.gold_seats}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Silver Seats:</span>
                      <span className="font-bold text-gray-600">{viewingScreen.silver_seats}</span>
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
