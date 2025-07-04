import React, { useState, useCallback, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { ArrowLeft, Save, Settings, Monitor, DoorOpen, RotateCcw, MousePointer, Square, Rows, Columns, Edit, Trash2, Eye, Plus, Loader2 } from 'lucide-react'
import { screensAPI } from "../services/api.js"

const CinemaScreenDesigner = () => {
  const [currentView, setCurrentView] = useState("list") // "designer" or "list"
  const [screenName, setScreenName] = useState("")
  const [editingScreen, setEditingScreen] = useState(null)
  const [layout, setLayout] = useState({
    rows: 0,
    columns: 0,
    seats: [],
    screenPosition: "top",
  })
  const [pricing, setPricing] = useState({
    premium: 100,
    gold: 90,
    silver: 70,
  })
  const [selectedTool, setSelectedTool] = useState("silver")
  const [selectedSeats, setSelectedSeats] = useState(new Set())
  const [rowLabels, setRowLabels] = useState({})
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectionMode, setSelectionMode] = useState("single")
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [screenToDelete, setScreenToDelete] = useState(null)
  const [saveMessage, setSaveMessage] = useState("")
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [viewingScreen, setViewingScreen] = useState(null)
  const [screens, setScreens] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const layoutRef = useRef(null)

  // Fetch screens on component mount
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

  const initializeSeats = useCallback(() => {
    const seats = []
    for (let row = 0; row < layout.rows; row++) {
      for (let col = 0; col < layout.columns; col++) {
        seats.push({
          id: `${row}-${col}`,
          row: rowLabels[row] || String.fromCharCode(65 + row),
          column: col + 1,
          type: "silver",
          price: pricing.silver,
          isBlocked: false,
        })
      }
    }
    setLayout((prev) => ({ ...prev, seats }))
  }, [layout.rows, layout.columns, pricing, rowLabels])

  useEffect(() => {
    if (!editingScreen) {
      initializeSeats()
    }
  }, [layout.rows, layout.columns, editingScreen])

  const updateSeat = (seatId, updates) => {
    setLayout((prev) => ({
      ...prev,
      seats: prev.seats.map((seat) => (seat.id === seatId ? { ...seat, ...updates } : seat)),
    }))
  }

  const updateMultipleSeats = (seatIds, updates) => {
    setLayout((prev) => ({
      ...prev,
      seats: prev.seats.map((seat) => (seatIds.includes(seat.id) ? { ...seat, ...updates } : seat)),
    }))
  }

  const reassignRowLabels = () => {
    const newRowLabels = {}
    let labelIndex = 0
    for (let row = 0; row < layout.rows; row++) {
      const rowSeats = layout.seats.filter((seat) => seat.id.startsWith(`${row}-`))
      const isRowAllPassages = rowSeats.every((seat) => seat.type === "passage")
      if (!isRowAllPassages) {
        newRowLabels[row] = String.fromCharCode(65 + labelIndex)
        labelIndex++
      } else {
        newRowLabels[row] = ""
      }
    }
    setRowLabels(newRowLabels)
    setLayout((prev) => ({
      ...prev,
      seats: prev.seats.map((seat) => {
        const [row] = seat.id.split("-").map(Number)
        return {
          ...seat,
          row: newRowLabels[row] || "",
        }
      }),
    }))
  }

  const handleSeatClick = (seat, event) => {
    if (selectionMode === "multi" && (event.ctrlKey || event.metaKey)) {
      setSelectedSeats((prev) => {
        const newSet = new Set(prev)
        if (newSet.has(seat.id)) {
          newSet.delete(seat.id)
        } else {
          newSet.add(seat.id)
        }
        return newSet
      })
      return
    }

    if (selectionMode === "multi" && event.shiftKey && selectedSeats.size > 0) {
      const lastSelected = Array.from(selectedSeats)[selectedSeats.size - 1]
      const [lastRow, lastCol] = lastSelected.split("-").map(Number)
      const [currentRow, currentCol] = seat.id.split("-").map(Number)

      const minRow = Math.min(lastRow, currentRow)
      const maxRow = Math.max(lastRow, currentRow)
      const minCol = Math.min(lastCol, currentCol)
      const maxCol = Math.max(lastCol, currentCol)

      const rangeSeats = new Set(selectedSeats)
      for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
          rangeSeats.add(`${r}-${c}`)
        }
      }
      setSelectedSeats(rangeSeats)
      return
    }

    const seatsToUpdate = selectedSeats.size > 0 ? Array.from(selectedSeats) : [seat.id]

    if (selectedTool === "block") {
      updateMultipleSeats(seatsToUpdate, { isBlocked: !seat.isBlocked })
    } else if (selectedTool === "passage") {
      updateMultipleSeats(seatsToUpdate, { type: "passage", price: 0 })
      setTimeout(reassignRowLabels, 100)
    } else if (selectedTool === "entrance") {
      updateMultipleSeats(seatsToUpdate, { type: "entrance", price: 0 })
    } else if (selectedTool === "door") {
      updateMultipleSeats(seatsToUpdate, { type: "door", price: 0 })
    } else {
      updateMultipleSeats(seatsToUpdate, {
        type: selectedTool,
        price: pricing[selectedTool],
      })
    }

    setSelectedSeats(new Set())
  }

  const selectFullRow = (rowIndex) => {
    const rowSeats = new Set()
    for (let col = 0; col < layout.columns; col++) {
      rowSeats.add(`${rowIndex}-${col}`)
    }
    setSelectedSeats(rowSeats)
  }

  const selectFullColumn = (colIndex) => {
    const colSeats = new Set()
    for (let row = 0; row < layout.rows; row++) {
      colSeats.add(`${row}-${colIndex}`)
    }
    setSelectedSeats(colSeats)
  }

  const clearSelection = () => {
    setSelectedSeats(new Set())
  }

  const getSeatColor = (seat) => {
    const isSelected = selectedSeats.has(seat.id)
    const baseClasses = "transition-all duration-200 border-2"

    if (isSelected) {
      return `${baseClasses} border-blue-500 ring-2 ring-blue-200 scale-105`
    }

    if (seat.isBlocked) return `${baseClasses} bg-red-500 border-red-600 text-white`

    switch (seat.type) {
      case "premium":
        return `${baseClasses} bg-gradient-to-br from-yellow-400 to-yellow-500 border-yellow-600 hover:from-yellow-500 hover:to-yellow-600 text-yellow-900 shadow-md`
      case "gold":
        return `${baseClasses} bg-gradient-to-br from-blue-400 to-blue-500 border-blue-600 hover:from-blue-500 hover:to-blue-600 text-blue-900 shadow-md`
      case "silver":
        return `${baseClasses} bg-gradient-to-br from-gray-300 to-gray-400 border-gray-500 hover:from-gray-400 hover:to-gray-500 text-gray-800 shadow-md`
      case "passage":
        return `${baseClasses} bg-transparent border-dashed border-gray-300 hover:border-gray-400`
      case "entrance":
        return `${baseClasses} bg-gradient-to-br from-green-400 to-green-500 border-green-600 text-green-900 shadow-md`
      case "door":
        return `${baseClasses} bg-gradient-to-br from-orange-400 to-orange-500 border-orange-600 text-orange-900 shadow-md`
      default:
        return `${baseClasses} bg-gray-300 border-gray-400`
    }
  }

  const startNewScreen = () => {
    setEditingScreen(null)
    setScreenName("")
    setLayout({
      rows: 10,
      columns: 15,
      seats: [],
      screenPosition: "top",
    })
    setPricing({
      premium: 100,
      gold: 90,
      silver: 70,
    })
    setRowLabels({})
    setSelectedSeats(new Set())
    setCurrentView("designer")
  }

  const editScreen = (screen) => {
    setEditingScreen(screen)
    setScreenName(screen.name)
    setLayout(screen.layout)
    setPricing({
      premium: screen.premium_price,
      gold: screen.gold_price,
      silver: screen.silver_price,
    })
    setCurrentView("designer")
  }

  const saveScreen = async () => {
    if (!screenName.trim()) {
      setSaveMessage("Please enter a screen name")
      setShowSaveDialog(true)
      return
    }

    try {
      setLoading(true)
      setError("")

      const seatCounts = layout.seats.reduce(
        (acc, seat) => {
          if (seat.type in acc) {
            acc[seat.type]++
          }
          return acc
        },
        { premium: 0, gold: 0, silver: 0 },
      )

      const screenData = {
        name: screenName,
        total_seats: seatCounts.premium + seatCounts.gold + seatCounts.silver,
        premium_seats: seatCounts.premium,
        gold_seats: seatCounts.gold,
        silver_seats: seatCounts.silver,
        premium_price: pricing.premium,
        gold_price: pricing.gold,
        silver_price: pricing.silver,
        layout: layout,
        screen_position: layout.screenPosition,
        rows: layout.rows,
        columns: layout.columns,
      }

      if (editingScreen) {
        await screensAPI.updateScreen(editingScreen.id, screenData)
        setSaveMessage("Screen updated successfully!")
      } else {
        await screensAPI.createScreen(screenData)
        setSaveMessage("Screen saved successfully!")
      }

      await fetchScreens() // Refresh the screens list
      setShowSaveDialog(true)
    } catch (err) {
      setError(err.message || "Failed to save screen")
      setSaveMessage(err.message || "Failed to save screen")
      setShowSaveDialog(true)
    } finally {
      setLoading(false)
    }
  }

  const confirmSave = () => {
    setShowSaveDialog(false)
    if (!saveMessage.includes("Failed") && !saveMessage.includes("name")) {
      setCurrentView("list")
    }
  }

  const resetLayout = () => {
    setShowResetDialog(true)
  }

  const confirmReset = () => {
    initializeSeats()
    setSelectedSeats(new Set())
    setRowLabels({})
    setShowResetDialog(false)
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
      await fetchScreens() // Refresh the screens list
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

  const tools = [
    { id: "premium", label: "Premium", color: "bg-gradient-to-r from-yellow-400 to-yellow-500", icon: "💎" },
    { id: "gold", label: "Gold", color: "bg-gradient-to-r from-blue-400 to-blue-500", icon: "🥇" },
    { id: "silver", label: "Silver", color: "bg-gradient-to-r from-gray-300 to-gray-400", icon: "🥈" },
    { id: "passage", label: "Passage", color: "border-2 border-dashed border-gray-400", icon: "🚶" },
    { id: "entrance", label: "Entrance", color: "bg-gradient-to-r from-green-400 to-green-500", icon: "🚪" },
    { id: "door", label: "Door", color: "bg-gradient-to-r from-orange-400 to-orange-500", icon: "🔓" },
    { id: "block", label: "Block/Unblock", color: "bg-gradient-to-r from-red-500 to-red-600", icon: "❌" },
  ]

  if (currentView === "list") {
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
            onClick={startNewScreen}
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
          <Card className="text-center py-12">
            <CardContent>
              <Loader2 className="h-16 w-16 mx-auto text-muted-foreground mb-4 animate-spin" />
              <h3 className="text-xl font-semibold mb-2">Loading screens...</h3>
              <p className="text-muted-foreground">Please wait while we fetch your screens</p>
            </CardContent>
          </Card>
        ) : screens.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Monitor className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No screens created yet</h3>
              <p className="text-muted-foreground mb-4">Create your first cinema screen layout to get started</p>
              <Button onClick={startNewScreen} className="bg-gradient-to-r from-blue-600 to-purple-600">
                <Plus className="h-4 w-4 mr-2" />
                Create First Screen
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {screens.map((screen) => (
              <Card
                key={screen.id}
                className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg backdrop-blur dark:bg-zinc-900 dark:shadow-none"
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <span className="truncate text-zinc-800 dark:text-zinc-100">{screen.name}</span>
                    </div>
                    <Badge className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 dark:from-blue-900 dark:to-purple-900 dark:text-blue-100">
                      {screen.total_seats} seats
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="text-center p-2 rounded-lg bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900 dark:to-yellow-800">
                      <div className="font-bold text-yellow-800 dark:text-yellow-200">{screen.premium_seats}</div>
                      <div className="text-yellow-600 dark:text-yellow-300 text-xs">Premium</div>
                      <div className="text-yellow-700 dark:text-yellow-200 text-xs">Rs.{screen.premium_price}</div>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800">
                      <div className="font-bold text-blue-800 dark:text-blue-200">{screen.gold_seats}</div>
                      <div className="text-blue-600 dark:text-blue-300 text-xs">Gold</div>
                      <div className="text-blue-700 dark:text-blue-200 text-xs">Rs.{screen.gold_price}</div>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-800 dark:to-zinc-700">
                      <div className="font-bold text-gray-800 dark:text-zinc-200">{screen.silver_seats}</div>
                      <div className="text-gray-600 dark:text-zinc-400 text-xs">Silver</div>
                      <div className="text-gray-700 dark:text-zinc-200 text-xs">Rs.{screen.silver_price}</div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground dark:text-zinc-400 space-y-1">
                    <div>Created: {new Date(screen.created_at).toLocaleDateString()}</div>
                    {screen.updated_at && <div>Updated: {new Date(screen.updated_at).toLocaleDateString()}</div>}
                  </div>
                  <Separator className="dark:bg-zinc-700" />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 hover:bg-blue-50 hover:border-blue-300 bg-transparent dark:hover:bg-blue-900 dark:hover:border-blue-700"
                      onClick={() => editScreen(screen)}
                      disabled={loading}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 hover:bg-green-50 hover:border-green-300 bg-transparent dark:hover:bg-green-900 dark:hover:border-green-700"
                      onClick={() => viewScreen(screen)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="hover:bg-red-50 hover:border-red-300 hover:text-red-600 bg-transparent dark:hover:bg-red-900 dark:hover:border-red-700 dark:hover:text-red-400"
                      onClick={() => deleteScreen(screen)}
                      disabled={loading}
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
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
                        {Array.from({ length: viewingScreen.layout.columns }, (_, colIndex) => (
                          <div key={colIndex} className="w-9 text-center text-xs font-medium text-gray-500">
                            {colIndex + 1}
                          </div>
                        ))}
                      </div>

                      {/* Rows with seats */}
                      {Array.from({ length: viewingScreen.layout.rows }, (_, rowIndex) => {
                        const rowSeats = viewingScreen.layout.seats.filter((seat) => seat.id.startsWith(`${rowIndex}-`))
                        const hasValidSeats = rowSeats.some((seat) => seat.type !== "passage" && !seat.isBlocked)

                        if (!hasValidSeats) return null

                        return (
                          <div key={rowIndex} className="flex items-center gap-1 mb-2">
                            {/* Row label */}
                            <div className="w-6 text-center font-bold text-lg text-gray-700 dark:text-gray-300">
                              {String.fromCharCode(65 + rowIndex)}
                            </div>

                            {/* Seats */}
                            {Array.from({ length: viewingScreen.layout.columns }, (_, colIndex) => {
                              const seat = viewingScreen.layout.seats.find((s) => s.id === `${rowIndex}-${colIndex}`)
                              if (!seat) return <div key={colIndex} className="w-9 h-9" />

                              if (seat.type === "passage") {
                                return <div key={colIndex} className="w-9 h-9" />
                              }

                              if (seat.isBlocked || seat.type === "entrance" || seat.type === "door") {
                                return <div key={colIndex} className="w-9 h-9" />
                              }

                              const seatColor =
                                seat.type === "premium"
                                  ? "bg-gradient-to-br from-yellow-400 to-yellow-500 border-yellow-600 text-yellow-900 shadow-lg hover:shadow-xl"
                                  : seat.type === "gold"
                                    ? "bg-gradient-to-br from-blue-400 to-blue-500 border-blue-600 text-blue-900 shadow-lg hover:shadow-xl"
                                    : "bg-gradient-to-br from-gray-300 to-gray-400 border-gray-500 text-gray-800 shadow-md hover:shadow-lg"

                              return (
                                <button
                                  key={colIndex}
                                  className={`w-9 h-9 rounded-lg border-2 transition-all duration-200 hover:scale-105 active:scale-95 font-bold text-sm ${seatColor} cursor-pointer`}
                                  title={`Seat ${seat.row}${seat.column} - ${seat.type.toUpperCase()} - $${seat.price}`}
                                >
                                  {seat.column}
                                </button>
                              )
                            })}
                            {/* Row label (right side) */}
                            <div className="w-6 text-center font-bold text-lg text-gray-700 dark:text-gray-300">
                              {String.fromCharCode(65 + rowIndex)}
                            </div>
                          </div>
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

  return (
    <div className="container mx-auto p-6 space-y-6 min-h-screen">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => setCurrentView("list")} className="hover:bg-slate-100">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {/* Back to Screens */}
        </Button>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {editingScreen ? `Edit: ${editingScreen.name}` : "Cinema Screen Designer"}
          </h1>
          <p className="text-muted-foreground">Design your professional cinema screen layout</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Controls Panel */}
        <div className="xl:col-span-1 space-y-4">
          <Card className="shadow-lg border-0 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-600" />
                Screen Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="screenName" className="text-sm font-medium">
                  Screen Name
                </Label>
                <Input
                  id="screenName"
                  value={screenName}
                  onChange={(e) => setScreenName(e.target.value)}
                  placeholder="e.g., IMAX Screen 1"
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-medium">Rows</Label>
                  <Input
                    type="number"
                    value={layout.rows}
                    onChange={(e) => setLayout((prev) => ({ ...prev, rows: Number.parseInt(e.target.value) || 1 }))}
                    min="1"
                    max="20"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Columns</Label>
                  <Input
                    type="number"
                    value={layout.columns}
                    onChange={(e) => setLayout((prev) => ({ ...prev, columns: Number.parseInt(e.target.value) || 1 }))}
                    min="1"
                    max="30"
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Screen Position</Label>
                <Select
                  value={layout.screenPosition}
                  onValueChange={(value) => setLayout((prev) => ({ ...prev, screenPosition: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top">Top</SelectItem>
                    <SelectItem value="bottom">Bottom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(pricing).map(([type, price]) => (
                <div key={type}>
                  <Label className="text-sm font-medium capitalize">{type} (Rs.)</Label>
                  <Input
                    type="number"
                    value={price}
                    onChange={(e) =>
                      setPricing((prev) => ({
                        ...prev,
                        [type]: Number.parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="mt-1"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Selection Mode</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { id: "single", label: "Single Select", icon: MousePointer },
                { id: "multi", label: "Multi Select", icon: Square },
              ].map((mode) => (
                <Button
                  key={mode.id}
                  variant={selectionMode === mode.id ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => setSelectionMode(mode.id)}
                >
                  <mode.icon className="h-4 w-4 mr-2" />
                  {mode.label}
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Tools</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {tools.map((tool) => (
                <Button
                  key={tool.id}
                  variant={selectedTool === tool.id ? "default" : "outline"}
                  className="w-full justify-start text-left"
                  onClick={() => setSelectedTool(tool.id)}
                >
                  <span className="mr-2">{tool.icon}</span>
                  <span className="flex-1">{tool.label}</span>
                  {tool.id in pricing && (
                    <Badge variant="secondary" className="ml-2">
                      Rs.{pricing[tool.id]}
                    </Badge>
                  )}
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Layout Designer */}
        <div className="xl:col-span-4">
          <Card className="shadow-xl border-0 backdrop-blur">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5 text-blue-600" />
                  Screen Layout Designer
                </CardTitle>
                <div className="flex gap-2">
                  {selectedSeats.size > 0 && (
                    <Badge variant="secondary" className="px-3 py-1">
                      {selectedSeats.size} selected
                    </Badge>
                  )}
                  <Button variant="outline" size="sm" onClick={clearSelection}>
                    Clear Selection
                  </Button>
                  <Button variant="outline" size="sm" onClick={resetLayout}>
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Reset
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Screen */}
                {layout.screenPosition === "top" && (
                  <div className="flex justify-center">
                    <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white px-12 py-3 rounded-lg shadow-lg flex items-center gap-3">
                      <Monitor className="h-5 w-5" />
                      <span className="font-bold tracking-wider">SCREEN</span>
                    </div>
                  </div>
                )}

                {/* Quick Selection Tools */}
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" size="sm" onClick={() => { }}>
                    <Rows className="h-4 w-4 mr-1" />
                    Select Rows
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { }}>
                    <Columns className="h-4 w-4 mr-1" />
                    Select Columns
                  </Button>
                </div>

                {/* Seating Layout */}
                <div className="overflow-auto p-6 rounded-lg">
                  <div className="inline-block min-w-full">
                    {/* Column headers */}
                    <div className="flex items-center gap-1 mb-2">
                      <div className="w-12"></div>
                      {Array.from({ length: layout.columns }, (_, colIndex) => (
                        <button
                          key={colIndex}
                          className="w-10 h-6 text-xs font-medium bg-secondary/50 hover:bg-secondary rounded transition-colors"
                          onClick={() => selectFullColumn(colIndex)}
                          title={`Select column ${colIndex + 1}`}
                        >
                          {colIndex + 1}
                        </button>
                      ))}
                    </div>

                    {/* Rows */}
                    {Array.from({ length: layout.rows }, (_, rowIndex) => (
                      <div key={rowIndex} className="flex items-center gap-1 mb-1">
                        {/* Row selector and label */}
                        <div className="flex items-center gap-1">
                          <button
                            className="w-6 h-10 text-xs font-medium bg-secondary/50 hover:bg-secondary rounded transition-colors"
                            onClick={() => selectFullRow(rowIndex)}
                            title={`Select row ${rowLabels[rowIndex] || String.fromCharCode(65 + rowIndex)}`}
                          >
                            ⬌
                          </button>
                          <div className="w-4 text-center font-bold text-sm">
                            {rowLabels[rowIndex] || String.fromCharCode(65 + rowIndex)}
                          </div>
                        </div>

                        {/* Seats */}
                        {Array.from({ length: layout.columns }, (_, colIndex) => {
                          const seat = layout.seats.find((s) => s.id === `${rowIndex}-${colIndex}`)
                          if (!seat) return null

                          return (
                            <button
                              key={`${rowIndex}-${colIndex}`}
                              className={`w-10 h-10 rounded-lg text-xs font-bold ${getSeatColor(seat)} hover:scale-105 active:scale-95`}
                              onClick={(e) => handleSeatClick(seat, e)}
                              title={`${seat.row}${seat.column} - ${seat.type} - $${seat.price}`}
                            >
                              {seat.type === "passage" ? (
                                ""
                              ) : seat.type === "entrance" ? (
                                <DoorOpen className="h-4 w-4 mx-auto" />
                              ) : seat.type === "door" ? (
                                <DoorOpen className="h-4 w-4 mx-auto" />
                              ) : seat.isBlocked ? (
                                "✕"
                              ) : (
                                seat.column
                              )}
                            </button>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Screen */}
                {layout.screenPosition === "bottom" && (
                  <div className="flex justify-center">
                    <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white px-12 py-3 rounded-lg shadow-lg flex items-center gap-3">
                      <Monitor className="h-5 w-5" />
                      <span className="font-bold tracking-wider">SCREEN</span>
                    </div>
                  </div>
                )}

                {/* Legend */}
                <div className="p-4 rounded-lg shadow-inner">
                  <h4 className="font-semibold mb-3">Legend</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {tools.map((tool) => (
                      <div key={tool.id} className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded ${tool.color} flex items-center justify-center text-xs`}>
                          {tool.icon}
                        </div>
                        <span className="text-sm font-medium">{tool.label}</span>
                        {tool.id in pricing && (
                          <span className="text-xs text-muted-foreground">(Rs.{pricing[tool.id]})</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Action Buttons */}
                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    💡 Tip: Use Ctrl+Click for multi-select, Shift+Click for range select
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setCurrentView("list")} disabled={loading}>
                      Cancel
                    </Button>
                    <Button onClick={saveScreen} className="bg-green-600 hover:bg-green-700" disabled={loading}>
                      {loading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      {editingScreen ? "Update Screen" : "Save Screen"}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Save Success Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{saveMessage.includes("name") || saveMessage.includes("Failed") ? "Error" : "Success"}</DialogTitle>
            <DialogDescription>{saveMessage}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            {saveMessage.includes("name") || saveMessage.includes("Failed") ? (
              <Button onClick={() => setShowSaveDialog(false)}>OK</Button>
            ) : (
              <Button onClick={confirmSave}>Continue</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Confirmation Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Layout</DialogTitle>
            <DialogDescription>
              Are you sure you want to reset the entire layout? This will remove all your current seat configurations.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset Layout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CinemaScreenDesigner