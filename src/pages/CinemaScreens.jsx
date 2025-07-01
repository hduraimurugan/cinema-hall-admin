import React, { useState, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  Save,
  Settings,
  Monitor,
  DoorOpen,
  RotateCcw,
  MousePointer,
  Square,
  Rows,
  Columns,
} from "lucide-react"

const CinemaScreenDesigner = () => {
  const [currentView, setCurrentView] = useState("list") // "designer" or "list"
  const [screenName, setScreenName] = useState("")
  const [layout, setLayout] = useState({
    rows: 10,
    columns: 15,
    seats: [],
    screenPosition: "top",
  })
  const [pricing, setPricing] = useState({
    premium: 25,
    gold: 20,
    silver: 15,
  })
  const [selectedTool, setSelectedTool] = useState("silver")
  const [selectedSeats, setSelectedSeats] = useState(new Set())
  const [rowLabels, setRowLabels] = useState({})
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectionMode, setSelectionMode] = useState("single") // "single", "multi", "row", "column"
  const layoutRef = useRef(null)

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

  React.useEffect(() => {
    initializeSeats()
  }, [layout.rows, layout.columns])

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

    // Update seat row labels
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
      // Implement shift+click range selection
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

    // Apply tool to seat(s)
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

  const saveScreen = () => {
    if (!screenName.trim()) {
      alert("Please enter a screen name")
      return
    }

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
      id: Date.now().toString(),
      name: screenName,
      totalSeats: seatCounts.premium + seatCounts.gold + seatCounts.silver,
      premiumSeats: seatCounts.premium,
      goldSeats: seatCounts.gold,
      silverSeats: seatCounts.silver,
      premiumPrice: pricing.premium,
      goldPrice: pricing.gold,
      silverPrice: pricing.silver,
      layout: layout,
      createdAt: new Date().toISOString(),
    }

    const existingScreens = JSON.parse(localStorage.getItem("cinema-screens") || "[]")
    existingScreens.push(screenData)
    localStorage.setItem("cinema-screens", JSON.stringify(existingScreens))

    alert("Screen saved successfully!")
    setCurrentView("list")
  }

  const resetLayout = () => {
    if (confirm("Are you sure you want to reset the entire layout?")) {
      initializeSeats()
      setSelectedSeats(new Set())
      setRowLabels({})
    }
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
    const screens = JSON.parse(localStorage.getItem("cinema-screens") || "[]")

    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Cinema Screens</h1>
            <p className="text-muted-foreground">Manage your cinema screen layouts</p>
          </div>
          <Button onClick={() => setCurrentView("designer")} className="">
            Add New Screen
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {screens.map((screen) => (
            <Card key={screen.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {screen.name}
                  <Badge variant="secondary">{screen.totalSeats} seats</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Premium:</span>
                    <span>{screen.premiumSeats} seats</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Gold:</span>
                    <span>{screen.goldSeats} seats</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Silver:</span>
                    <span>{screen.silverSeats} seats</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6 min-h-screen">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => setCurrentView("list")} className="hover:bg-slate-100">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Screens
        </Button>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Cinema Screen Designer
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
                  <Label className="text-sm font-medium capitalize">{type} ($)</Label>
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
                      ${pricing[tool.id]}
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
                      <span className="font-bold tracking-wider">SCREENS THIS WAY</span>
                    </div>
                  </div>
                )}

                {/* Quick Selection Tools */}
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" size="sm" onClick={() => {}}>
                    <Rows className="h-4 w-4 mr-1" />
                    Select Rows
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => {}}>
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
                <div className=" p-4 rounded-lg shadow-inner">
                  <h4 className="font-semibold mb-3">Legend</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {tools.map((tool) => (
                      <div key={tool.id} className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded ${tool.color} flex items-center justify-center text-xs`}>
                          {tool.icon}
                        </div>
                        <span className="text-sm font-medium">{tool.label}</span>
                        {tool.id in pricing && (
                          <span className="text-xs text-muted-foreground">(${pricing[tool.id]})</span>
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
                    <Button variant="outline" onClick={() => setCurrentView("list")}>
                      Cancel
                    </Button>
                    <Button onClick={saveScreen} className="bg-green-600 hover:bg-green-700">
                      <Save className="h-4 w-4 mr-2" />
                      Save Screen
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default CinemaScreenDesigner
