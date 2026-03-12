import React, { useState, useCallback, useRef, useEffect } from "react"
import { useParams, useNavigate, useLocation } from "react-router-dom"

// ── Migration: converts old passage-seat format → new aisleAfterColumns/Rows format ──
function migrateLayoutFromPassage(layout) {
  if (!layout || !layout.seats) return layout
  if (layout.aisleAfterColumns !== undefined) return layout // already new format

  const { rows, columns, seats } = layout

  // Find column indices (0-based) where ALL rows have passage
  const passageCols = new Set()
  for (let col = 0; col < columns; col++) {
    const allPassage = Array.from({ length: rows }, (_, r) =>
      seats.find((s) => s.id === `${r}-${col}`)?.type === "passage"
    ).every(Boolean)
    if (allPassage) passageCols.add(col)
  }

  // Find row indices (0-based) where ALL columns have passage
  const passageRows = new Set()
  for (let row = 0; row < rows; row++) {
    const allPassage = Array.from({ length: columns }, (_, c) =>
      seats.find((s) => s.id === `${row}-${c}`)?.type === "passage"
    ).every(Boolean)
    if (allPassage) passageRows.add(row)
  }

  const realCols = Array.from({ length: columns }, (_, i) => i).filter((c) => !passageCols.has(c))
  const realRows = Array.from({ length: rows }, (_, i) => i).filter((r) => !passageRows.has(r))
  const oldColToNew = Object.fromEntries(realCols.map((c, i) => [c, i]))
  const oldRowToNew = Object.fromEntries(realRows.map((r, i) => [r, i]))
  const newRowLetters = realRows.map((_, i) => String.fromCharCode(65 + i))

  // Compute aisleAfterColumns: 1-indexed column number just before each passage cluster
  const aisleAfterColumns = []
  let inPassage = false
  let lastRealColNew = -1
  for (let c = 0; c < columns; c++) {
    if (!passageCols.has(c)) { lastRealColNew = oldColToNew[c]; inPassage = false }
    else if (!inPassage) { if (lastRealColNew >= 0) aisleAfterColumns.push(lastRealColNew + 1); inPassage = true }
  }

  // Compute aisleAfterRows: row letter of last real row before each passage cluster
  const aisleAfterRows = []
  let inPassageRow = false
  let lastRealRowNew = -1
  for (let r = 0; r < rows; r++) {
    if (!passageRows.has(r)) { lastRealRowNew = oldRowToNew[r]; inPassageRow = false }
    else if (!inPassageRow) { if (lastRealRowNew >= 0) aisleAfterRows.push(newRowLetters[lastRealRowNew]); inPassageRow = true }
  }

  // Build new seats: remove passage seats, renumber remaining
  const newSeats = seats
    .filter((s) => s.type !== "passage")
    .filter((s) => {
      const [r, c] = s.id.split("-").map(Number)
      return !passageCols.has(c) && !passageRows.has(r)
    })
    .map((s) => {
      const [r, c] = s.id.split("-").map(Number)
      const nr = oldRowToNew[r], nc = oldColToNew[c]
      const newRow = newRowLetters[nr]
      const newColumn = nc + 1
      return { ...s, id: `${nr}-${nc}`, row: newRow, column: newColumn, label: `${newRow}-${newColumn}` }
    })

  return {
    ...layout,
    rows: realRows.length,
    columns: realCols.length,
    aisleAfterColumns: aisleAfterColumns.sort((a, b) => a - b),
    aisleAfterRows: aisleAfterRows.sort(),
    seats: newSeats,
  }
}

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
import { ArrowLeft, Save, Settings, Monitor, DoorOpen, RotateCcw, MousePointer, Square, Loader2 } from 'lucide-react'
import { screensAPI } from "../services/api.js"

const ScreenDesignerPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { state } = useLocation()
  const isEditing = !!id

  const [screenName, setScreenName] = useState("")
  const [layout, setLayout] = useState({
    rows: 10,
    columns: 15,
    seats: [],
    screenPosition: "top",
    aisleAfterColumns: [],
    aisleAfterRows: [],
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
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [saveMessage, setSaveMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const layoutRef = useRef(null)

  // Initialize: load screen for editing, or blank for new
  useEffect(() => {
    if (isEditing) {
      if (!state?.screen) {
        navigate('/screens', { replace: true })
        return
      }
      const screen = state.screen
      const migrated = migrateLayoutFromPassage(screen.layout)
      migrated.seats = migrated.seats.map((s) =>
        s.label ? s : { ...s, label: `${s.row}-${s.column}` }
      )
      setScreenName(screen.name)
      setLayout(migrated)
      setPricing({
        premium: screen.premium_price,
        gold: screen.gold_price,
        silver: screen.silver_price,
      })
    }
    // For add mode, defaults are already set
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const initializeSeats = useCallback(() => {
    const seats = []
    for (let row = 0; row < layout.rows; row++) {
      for (let col = 0; col < layout.columns; col++) {
        const rowLetter = rowLabels[row] || String.fromCharCode(65 + row)
        const colNumber = col + 1
        seats.push({
          id: `${row}-${col}`,
          row: rowLetter,
          column: colNumber,
          label: `${rowLetter}-${colNumber}`,
          type: "silver",
          isBlocked: false,
        })
      }
    }
    setLayout((prev) => ({
      ...prev,
      seats,
      aisleAfterColumns: prev.aisleAfterColumns || [],
      aisleAfterRows: prev.aisleAfterRows || [],
    }))
  }, [layout.rows, layout.columns, pricing, rowLabels])

  useEffect(() => {
    if (!isEditing) {
      initializeSeats()
    }
  }, [layout.rows, layout.columns]) // eslint-disable-line react-hooks/exhaustive-deps

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

    if (selectedTool === "aisle") return // aisle tool works on column/row headers, not seats

    const seatsToUpdate = selectedSeats.size > 0 ? Array.from(selectedSeats) : [seat.id]

    if (selectedTool === "block") {
      updateMultipleSeats(seatsToUpdate, { isBlocked: !seat.isBlocked })
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

  const toggleAisleAfterColumn = (colNumber) => {
    if (colNumber >= layout.columns) return
    setLayout((prev) => {
      const existing = prev.aisleAfterColumns || []
      const updated = existing.includes(colNumber)
        ? existing.filter((c) => c !== colNumber)
        : [...existing, colNumber].sort((a, b) => a - b)
      return { ...prev, aisleAfterColumns: updated }
    })
  }

  const toggleAisleAfterRow = (rowLetter) => {
    const letters = Array.from({ length: layout.rows }, (_, i) => String.fromCharCode(65 + i))
    if (rowLetter === letters[letters.length - 1]) return
    setLayout((prev) => {
      const existing = prev.aisleAfterRows || []
      const updated = existing.includes(rowLetter)
        ? existing.filter((r) => r !== rowLetter)
        : [...existing, rowLetter].sort()
      return { ...prev, aisleAfterRows: updated }
    })
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
      case "entrance":
        return `${baseClasses} bg-gradient-to-br from-green-400 to-green-500 border-green-600 text-green-900 shadow-md`
      case "door":
        return `${baseClasses} bg-gradient-to-br from-orange-400 to-orange-500 border-orange-600 text-orange-900 shadow-md`
      default:
        return `${baseClasses} bg-gray-300 border-gray-400`
    }
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

      if (isEditing) {
        await screensAPI.updateScreen(id, screenData)
        setSaveMessage("Screen updated successfully!")
      } else {
        await screensAPI.createScreen(screenData)
        setSaveMessage("Screen saved successfully!")
      }

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
      navigate('/screens')
    }
  }

  const resetLayout = () => {
    setShowResetDialog(true)
  }

  const confirmReset = () => {
    setLayout((prev) => ({ ...prev, aisleAfterColumns: [], aisleAfterRows: [] }))
    initializeSeats()
    setSelectedSeats(new Set())
    setRowLabels({})
    setShowResetDialog(false)
  }

  const tools = [
    { id: "premium", label: "Premium", color: "bg-gradient-to-r from-yellow-400 to-yellow-500", icon: "💎" },
    { id: "gold", label: "Gold", color: "bg-gradient-to-r from-blue-400 to-blue-500", icon: "🥇" },
    { id: "silver", label: "Silver", color: "bg-gradient-to-r from-gray-300 to-gray-400", icon: "🥈" },
    { id: "aisle", label: "Aisle", color: "border-2 border-dashed border-purple-400 bg-purple-50", icon: "↔", description: "Click column/row headers to add or remove aisle gaps" },
    { id: "entrance", label: "Entrance", color: "bg-gradient-to-r from-green-400 to-green-500", icon: "🚪" },
    { id: "door", label: "Door", color: "bg-gradient-to-r from-orange-400 to-orange-500", icon: "🔓" },
    { id: "block", label: "Block/Unblock", color: "bg-gradient-to-r from-red-500 to-red-600", icon: "❌" },
  ]

  return (
    <div className="container mx-auto p-6 space-y-6 min-h-screen">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate('/screens')} className="hover:bg-slate-100">
          <ArrowLeft className="h-4 w-4 mr-2" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {isEditing ? `Edit: ${screenName}` : "Cinema Screen Designer"}
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

                {/* Aisle mode hint */}
                {selectedTool === "aisle" && (
                  <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-purple-50 dark:bg-purple-950 border border-dashed border-purple-300 text-purple-700 dark:text-purple-300 text-sm">
                    <span>↔</span>
                    <span>Click a <strong>column number</strong> to toggle a vertical aisle after it. Click a row's <strong>⬌</strong> button to toggle a horizontal aisle.</span>
                  </div>
                )}

                {/* Seating Layout */}
                <div className="overflow-auto p-6 rounded-lg">
                  <div className="inline-block min-w-full">
                    {/* Column headers */}
                    <div className="flex items-center gap-1 mb-2">
                      <div className="w-12"></div>
                      {Array.from({ length: layout.columns }, (_, colIndex) => {
                        const colNumber = colIndex + 1
                        const hasAisle = (layout.aisleAfterColumns || []).includes(colNumber)
                        return (
                          <React.Fragment key={colIndex}>
                            <button
                              className={`w-10 h-6 text-xs font-medium rounded transition-colors ${
                                selectedTool === "aisle"
                                  ? hasAisle
                                    ? "bg-purple-300 border border-purple-500 text-purple-900 dark:bg-purple-700 dark:text-purple-100"
                                    : "bg-purple-100 hover:bg-purple-200 border border-dashed border-purple-300 text-purple-700 dark:bg-purple-900/40 dark:hover:bg-purple-900/70"
                                  : "bg-secondary/50 hover:bg-secondary"
                              }`}
                              onClick={() =>
                                selectedTool === "aisle"
                                  ? toggleAisleAfterColumn(colNumber)
                                  : selectFullColumn(colIndex)
                              }
                              title={
                                selectedTool === "aisle"
                                  ? hasAisle
                                    ? `Remove aisle after column ${colNumber}`
                                    : `Add aisle after column ${colNumber}`
                                  : `Select column ${colNumber}`
                              }
                            >
                              {colNumber}
                            </button>
                            {hasAisle && colIndex < layout.columns - 1 && (
                              <div className="w-5 flex items-center justify-center opacity-50">
                                <div className="w-0.5 h-4 bg-purple-400 rounded" />
                              </div>
                            )}
                          </React.Fragment>
                        )
                      })}
                    </div>

                    {/* Rows */}
                    {Array.from({ length: layout.rows }, (_, rowIndex) => {
                      const rowLabel = rowLabels[rowIndex] || String.fromCharCode(65 + rowIndex)
                      const hasAisleAfterRow = (layout.aisleAfterRows || []).includes(rowLabel)
                      return (
                        <React.Fragment key={rowIndex}>
                          <div className="flex items-center gap-1 mb-1">
                            {/* Row selector and label */}
                            <div className="flex items-center gap-1">
                              <button
                                className={`w-6 h-10 text-xs font-medium rounded transition-colors ${
                                  selectedTool === "aisle"
                                    ? hasAisleAfterRow
                                      ? "bg-purple-300 border border-purple-500 text-purple-900 dark:bg-purple-700 dark:text-purple-100"
                                      : "bg-purple-100 hover:bg-purple-200 border border-dashed border-purple-300 text-purple-700 dark:bg-purple-900/40"
                                    : "bg-secondary/50 hover:bg-secondary"
                                }`}
                                onClick={() =>
                                  selectedTool === "aisle"
                                    ? toggleAisleAfterRow(rowLabel)
                                    : selectFullRow(rowIndex)
                                }
                                title={
                                  selectedTool === "aisle"
                                    ? hasAisleAfterRow
                                      ? `Remove aisle after row ${rowLabel}`
                                      : `Add aisle after row ${rowLabel}`
                                    : `Select row ${rowLabel}`
                                }
                              >
                                ⬌
                              </button>
                              <div className={`w-4 text-center font-bold text-sm ${hasAisleAfterRow ? "text-purple-600" : ""}`}>
                                {rowLabel}
                              </div>
                            </div>

                            {/* Seats with column aisle spacers */}
                            {Array.from({ length: layout.columns }, (_, colIndex) => {
                              const colNumber = colIndex + 1
                              const hasAisleAfterCol = (layout.aisleAfterColumns || []).includes(colNumber)
                              const seat = layout.seats.find((s) => s.id === `${rowIndex}-${colIndex}`)
                              return (
                                <React.Fragment key={`${rowIndex}-${colIndex}`}>
                                  {seat ? (
                                    <button
                                      className={`w-10 h-10 rounded-lg text-xs font-bold ${getSeatColor(seat)} hover:scale-105 active:scale-95`}
                                      onClick={(e) => handleSeatClick(seat, e)}
                                      title={`${seat.row}${seat.column} - ${seat.type}${seat.price ? ` - Rs.${seat.price}` : ""}`}
                                    >
                                      {seat.type === "entrance" ? (
                                        <DoorOpen className="h-4 w-4 mx-auto" />
                                      ) : seat.type === "door" ? (
                                        <DoorOpen className="h-4 w-4 mx-auto" />
                                      ) : seat.isBlocked ? (
                                        "✕"
                                      ) : (
                                        seat.column
                                      )}
                                    </button>
                                  ) : (
                                    <div className="w-10 h-10" />
                                  )}
                                  {hasAisleAfterCol && colIndex < layout.columns - 1 && (
                                    <div className="w-5 flex items-center justify-center opacity-50">
                                      <div className="w-0.5 h-8 bg-purple-400 rounded" />
                                    </div>
                                  )}
                                </React.Fragment>
                              )
                            })}
                          </div>

                          {/* Horizontal aisle spacer after this row */}
                          {hasAisleAfterRow && (
                            <div className="flex items-center gap-1 my-1">
                              <div className="w-12" />
                              <div className="flex-1 h-0.5 bg-purple-300 rounded opacity-60" />
                            </div>
                          )}
                        </React.Fragment>
                      )
                    })}
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
                    <Button variant="outline" onClick={() => navigate('/screens')} disabled={loading}>
                      Cancel
                    </Button>
                    <Button onClick={saveScreen} className="bg-green-600 hover:bg-green-700" disabled={loading}>
                      {loading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      {isEditing ? "Update Screen" : "Save Screen"}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Save Success/Error Dialog */}
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

export default ScreenDesignerPage
