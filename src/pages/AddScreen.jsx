"use client"

import React, { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Save, Settings, Monitor, DoorOpen, RotateCcw, MousePointer, Square, Rows, Columns } from 'lucide-react'

const AddScreen = ({ onBack, onSave }) => {
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
  const [selectionMode, setSelectionMode] = useState("single")

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
      return `${baseClasses} border-primary ring-2 ring-primary/20 scale-105`
    }

    if (seat.isBlocked) return `${baseClasses} bg-destructive border-destructive text-destructive-foreground`

    switch (seat.type) {
      case "premium":
        return `${baseClasses} bg-primary border-primary hover:bg-primary/90 text-primary-foreground`
      case "gold":
        return `${baseClasses} bg-secondary border-secondary hover:bg-secondary/90 text-secondary-foreground`
      case "silver":
        return `${baseClasses} bg-muted border-muted-foreground hover:bg-muted/90 text-muted-foreground`
      case "passage":
        return `${baseClasses} bg-transparent border-dashed border-muted-foreground hover:border-muted-foreground/70`
      case "entrance":
        return `${baseClasses} bg-accent border-accent hover:bg-accent/90 text-accent-foreground`
      case "door":
        return `${baseClasses} bg-accent/70 border-accent hover:bg-accent/80 text-accent-foreground`
      default:
        return `${baseClasses} bg-muted border-muted-foreground`
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

    if (onSave) {
      onSave(screenData)
    } else {
      alert("Screen saved successfully!")
    }
  }

  const resetLayout = () => {
    if (confirm("Are you sure you want to reset the entire layout?")) {
      initializeSeats()
      setSelectedSeats(new Set())
      setRowLabels({})
    }
  }

  const tools = [
    { id: "premium", label: "Premium", icon: "💎" },
    { id: "gold", label: "Gold", icon: "🥇" },
    { id: "silver", label: "Silver", icon: "🥈" },
    { id: "passage", label: "Passage", icon: "🚶" },
    { id: "entrance", label: "Entrance", icon: "🚪" },
    { id: "door", label: "Door", icon: "🔓" },
    { id: "block", label: "Block/Unblock", icon: "❌" },
  ]

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Screens
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Add New Screen</h1>
          <p className="text-muted-foreground">Design your professional cinema screen layout</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Controls Panel */}
        <div className="xl:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-5 w-5" />
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

          <Card>
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

          <Card>
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

          <Card>
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
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
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
                    <div className="bg-foreground text-background px-12 py-3 rounded-lg flex items-center gap-3">
                      <Monitor className="h-5 w-5" />
                      <span className="font-bold tracking-wider">SCREEN</span>
                    </div>
                  </div>
                )}

                {/* Quick Selection Tools */}
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" size="sm">
                    <Rows className="h-4 w-4 mr-1" />
                    Select Rows
                  </Button>
                  <Button variant="outline" size="sm">
                    <Columns className="h-4 w-4 mr-1" />
                    Select Columns
                  </Button>
                </div>

                {/* Seating Layout */}
                <div className="overflow-auto bg-muted/30 p-6 rounded-lg">
                  <div className="inline-block min-w-full">
                    {/* Column headers */}
                    <div className="flex items-center gap-1 mb-2">
                      <div className="w-12"></div>
                      {Array.from({ length: layout.columns }, (_, colIndex) => (
                        <button
                          key={colIndex}
                          className="w-10 h-6 text-xs font-medium bg-secondary hover:bg-secondary/80 rounded transition-colors"
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
                            className="w-6 h-10 text-xs font-medium bg-secondary hover:bg-secondary/80 rounded transition-colors"
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
                    <div className="bg-foreground text-background px-12 py-3 rounded-lg flex items-center gap-3">
                      <Monitor className="h-5 w-5" />
                      <span className="font-bold tracking-wider">SCREEN</span>
                    </div>
                  </div>
                )}

                {/* Legend */}
                <div className="bg-card p-4 rounded-lg border">
                  <h4 className="font-semibold mb-3">Legend</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {tools.map((tool) => (
                      <div key={tool.id} className="flex items-center gap-2">
                        <span className="text-sm">{tool.icon}</span>
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
                    <Button variant="outline" onClick={onBack}>
                      Cancel
                    </Button>
                    <Button onClick={saveScreen}>
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

export default AddScreen