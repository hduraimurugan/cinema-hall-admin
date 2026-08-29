import React, { useState, useCallback, useRef, useEffect, useMemo } from "react"
import { useParams, useNavigate, useLocation } from "react-router-dom"

// ── Migration: converts old passage-seat format → new aisleAfterColumns/Rows format ──
function migrateLayoutFromPassage(layout) {
  if (!layout || !layout.seats) return layout
  if (layout.aisleAfterColumns !== undefined) return layout // already new format

  const { rows, columns, seats } = layout

  const passageCols = new Set()
  for (let col = 0; col < columns; col++) {
    const allPassage = Array.from({ length: rows }, (_, r) =>
      seats.find((s) => s.id === `${r}-${col}`)?.type === "passage"
    ).every(Boolean)
    if (allPassage) passageCols.add(col)
  }

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

  const aisleAfterColumns = []
  let inPassage = false
  let lastRealColNew = -1
  for (let c = 0; c < columns; c++) {
    if (!passageCols.has(c)) { lastRealColNew = oldColToNew[c]; inPassage = false }
    else if (!inPassage) { if (lastRealColNew >= 0) aisleAfterColumns.push(lastRealColNew + 1); inPassage = true }
  }

  const aisleAfterRows = []
  let inPassageRow = false
  let lastRealRowNew = -1
  for (let r = 0; r < rows; r++) {
    if (!passageRows.has(r)) { lastRealRowNew = oldRowToNew[r]; inPassageRow = false }
    else if (!inPassageRow) { if (lastRealRowNew >= 0) aisleAfterRows.push(newRowLetters[lastRealRowNew]); inPassageRow = true }
  }

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
import {
  ArrowLeft, Save, Monitor, DoorOpen, RotateCcw,
  MousePointer, Square, Loader2, Eye, Undo2, Redo2, Hand,
} from 'lucide-react'
import { screensAPI } from "../services/api.js"

const historyColorClass = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  orange: 'bg-orange-500',
  red: 'bg-red-500',
  purple: 'bg-purple-500',
}

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const ScreenDesignerPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { state } = useLocation()
  const isEditing = !!id

  // ── Core state ──
  const [screenName, setScreenName] = useState("")
  const [layout, setLayout] = useState({
    rows: 10,
    columns: 15,
    seats: [],
    screenPosition: "top",
    aisleAfterColumns: [],
    aisleAfterRows: [],
  })
  const [pricing, setPricing] = useState({ premium: 100, gold: 90, silver: 70 })
  const [selectedTool, setSelectedTool] = useState("silver")
  const [selectedSeats, setSelectedSeats] = useState(new Set())
  const [rowLabels, setRowLabels] = useState({})
  const [selectionMode, setSelectionMode] = useState("single")
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [saveMessage, setSaveMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [inputRows, setInputRows] = useState(10)
  const [inputColumns, setInputColumns] = useState(15)

  // ── New state ──
  const [zoom, setZoom] = useState(80)
  const [undoStack, setUndoStack] = useState([])
  const [redoStack, setRedoStack] = useState([])
  const [historyLog, setHistoryLog] = useState([])
  const [isPanMode, setIsPanMode] = useState(false)

  // ── Refs ──
  const layoutRef = useRef(layout)
  const gridContainerRef = useRef(null)
  const rowsTimerRef = useRef(null)
  const colsTimerRef = useRef(null)
  const panRef = useRef({ active: false, startX: 0, startY: 0, scrollLeft: 0, scrollTop: 0 })

  // Keep layoutRef in sync
  useEffect(() => { layoutRef.current = layout }, [layout])

  useEffect(() => {
    return () => {
      clearTimeout(rowsTimerRef.current)
      clearTimeout(colsTimerRef.current)
    }
  }, [])

  // ── Undo / Redo ──
  const pushUndo = useCallback(() => {
    setUndoStack(prev => [...prev.slice(-49), layoutRef.current])
    setRedoStack([])
  }, [])

  const addHistory = useCallback((label, color = 'blue') => {
    setHistoryLog(prev => [{ label, timestamp: new Date(), color }, ...prev.slice(0, 49)])
  }, [])

  const undo = useCallback(() => {
    setUndoStack(prev => {
      if (prev.length === 0) return prev
      const snapshot = prev[prev.length - 1]
      setRedoStack(r => [layoutRef.current, ...r.slice(0, 49)])
      setLayout(snapshot)
      addHistory('Undone last action', 'orange')
      return prev.slice(0, -1)
    })
  }, [addHistory])

  const redo = useCallback(() => {
    setRedoStack(prev => {
      if (prev.length === 0) return prev
      const snapshot = prev[0]
      setUndoStack(u => [...u.slice(-49), layoutRef.current])
      setLayout(snapshot)
      addHistory('Redone last action', 'blue')
      return prev.slice(1)
    })
  }, [addHistory])

  // ── Initialize / Load ──
  useEffect(() => {
    if (isEditing) {
      if (!state?.screen) { navigate('/screens', { replace: true }); return }
      const screen = state.screen
      const migrated = migrateLayoutFromPassage(screen.layout)
      migrated.seats = migrated.seats.map((s) =>
        s.label ? s : { ...s, label: `${s.row}-${s.column}` }
      )
      setScreenName(screen.name)
      setLayout(migrated)
      setInputRows(migrated.rows)
      setInputColumns(migrated.columns)
      setPricing({ premium: screen.premium_price, gold: screen.gold_price, silver: screen.silver_price })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const initializeSeats = useCallback(() => {
    const seats = []
    for (let row = 0; row < layout.rows; row++) {
      for (let col = 0; col < layout.columns; col++) {
        const rowLetter = rowLabels[row] || String.fromCharCode(65 + row)
        const colNumber = col + 1
        seats.push({ id: `${row}-${col}`, row: rowLetter, column: colNumber, label: `${rowLetter}-${colNumber}`, type: "silver", isBlocked: false })
      }
    }
    setLayout((prev) => ({ ...prev, seats, aisleAfterColumns: prev.aisleAfterColumns || [], aisleAfterRows: prev.aisleAfterRows || [] }))
    addHistory(`Grid generated (${layout.rows}×${layout.columns})`, 'purple')
  }, [layout.rows, layout.columns, rowLabels, addHistory])

  useEffect(() => {
    if (!isEditing) {
      initializeSeats()
    } else {
      setLayout((prev) => {
        const newSeats = []
        for (let row = 0; row < prev.rows; row++) {
          for (let col = 0; col < prev.columns; col++) {
            const id = `${row}-${col}`
            const existing = prev.seats.find((s) => s.id === id)
            if (existing) {
              newSeats.push(existing)
            } else {
              const rowLetter = rowLabels[row] || String.fromCharCode(65 + row)
              const colNumber = col + 1
              newSeats.push({ id, row: rowLetter, column: colNumber, label: `${rowLetter}-${colNumber}`, type: "silver", isBlocked: false })
            }
          }
        }
        return { ...prev, seats: newSeats }
      })
    }
  }, [layout.rows, layout.columns]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Seat operations ──
  const updateMultipleSeats = (seatIds, updates, historyLabel, historyColor = 'blue') => {
    pushUndo()
    setLayout((prev) => ({
      ...prev,
      seats: prev.seats.map((seat) => (seatIds.includes(seat.id) ? { ...seat, ...updates } : seat)),
    }))
    if (historyLabel) addHistory(historyLabel, historyColor)
  }

  const handleSeatClick = (seat, event) => {
    // Row mode: clicking a seat selects its entire row
    if (selectionMode === "row") {
      const [rowIndex] = seat.id.split("-").map(Number)
      selectFullRow(rowIndex)
      return
    }

    if (selectionMode === "multi" && (event.ctrlKey || event.metaKey)) {
      setSelectedSeats((prev) => {
        const newSet = new Set(prev)
        newSet.has(seat.id) ? newSet.delete(seat.id) : newSet.add(seat.id)
        return newSet
      })
      return
    }

    if (selectionMode === "multi" && event.shiftKey && selectedSeats.size > 0) {
      const lastSelected = Array.from(selectedSeats)[selectedSeats.size - 1]
      const [lastRow, lastCol] = lastSelected.split("-").map(Number)
      const [currentRow, currentCol] = seat.id.split("-").map(Number)
      const rangeSeats = new Set(selectedSeats)
      for (let r = Math.min(lastRow, currentRow); r <= Math.max(lastRow, currentRow); r++) {
        for (let c = Math.min(lastCol, currentCol); c <= Math.max(lastCol, currentCol); c++) {
          rangeSeats.add(`${r}-${c}`)
        }
      }
      setSelectedSeats(rangeSeats)
      return
    }

    if (selectedTool === "aisle") return

    const seatsToUpdate = selectedSeats.size > 0 ? Array.from(selectedSeats) : [seat.id]
    const count = seatsToUpdate.length

    if (selectedTool === "block") {
      updateMultipleSeats(seatsToUpdate, { isBlocked: !seat.isBlocked }, `${seat.isBlocked ? 'Unblocked' : 'Blocked'} ${count} seat(s)`, 'red')
    } else if (selectedTool === "entrance") {
      updateMultipleSeats(seatsToUpdate, { type: "entrance", price: 0 }, `Applied entrance to ${count} seat(s)`, 'green')
    } else if (selectedTool === "door") {
      updateMultipleSeats(seatsToUpdate, { type: "door", price: 0 }, `Applied door to ${count} seat(s)`, 'green')
    } else {
      updateMultipleSeats(seatsToUpdate, { type: selectedTool, price: pricing[selectedTool] }, `Applied ${selectedTool} to ${count} seat(s)`, 'blue')
    }

    setSelectedSeats(new Set())
  }

  const selectFullRow = (rowIndex) => {
    const rowSeats = new Set()
    for (let col = 0; col < layout.columns; col++) rowSeats.add(`${rowIndex}-${col}`)
    setSelectedSeats(rowSeats)
  }

  const selectFullColumn = (colIndex) => {
    const colSeats = new Set()
    for (let row = 0; row < layout.rows; row++) colSeats.add(`${row}-${colIndex}`)
    setSelectedSeats(colSeats)
  }

  const selectAll = useCallback(() => {
    const ids = layoutRef.current.seats.filter(s => !s.isBlocked).map(s => s.id)
    setSelectedSeats(new Set(ids))
    addHistory(`Selected all ${ids.length} seats`, 'blue')
  }, [addHistory])

  const clearSelection = () => setSelectedSeats(new Set())

  const fillSelectedRow = () => {
    if (selectedSeats.size === 0) return
    const lastId = Array.from(selectedSeats)[selectedSeats.size - 1]
    const [rowIndex] = lastId.split("-").map(Number)
    selectFullRow(rowIndex)
    addHistory(`Filled row ${String.fromCharCode(65 + rowIndex)}`, 'blue')
  }

  const applyToAllSelected = () => {
    if (selectedSeats.size === 0) return
    const ids = Array.from(selectedSeats)
    const count = ids.length
    if (selectedTool === 'block') {
      updateMultipleSeats(ids, { isBlocked: true }, `Blocked ${count} seat(s)`, 'red')
    } else if (selectedTool === 'entrance') {
      updateMultipleSeats(ids, { type: 'entrance', price: 0 }, `Applied entrance to ${count} seat(s)`, 'green')
    } else if (selectedTool === 'door') {
      updateMultipleSeats(ids, { type: 'door', price: 0 }, `Applied door to ${count} seat(s)`, 'green')
    } else if (['premium', 'gold', 'silver'].includes(selectedTool)) {
      updateMultipleSeats(ids, { type: selectedTool, price: pricing[selectedTool] }, `Applied ${selectedTool} to ${count} seat(s)`, 'blue')
    }
    setSelectedSeats(new Set())
  }

  // ── Aisles ──
  const toggleAisleAfterColumn = (colNumber) => {
    if (colNumber >= layout.columns) return
    pushUndo()
    setLayout((prev) => {
      const existing = prev.aisleAfterColumns || []
      const updated = existing.includes(colNumber)
        ? existing.filter((c) => c !== colNumber)
        : [...existing, colNumber].sort((a, b) => a - b)
      return { ...prev, aisleAfterColumns: updated }
    })
    addHistory(`Toggled aisle after column ${colNumber}`, 'green')
  }

  const toggleAisleAfterRow = (rowLetter) => {
    const letters = Array.from({ length: layout.rows }, (_, i) => String.fromCharCode(65 + i))
    if (rowLetter === letters[letters.length - 1]) return
    pushUndo()
    setLayout((prev) => {
      const existing = prev.aisleAfterRows || []
      const updated = existing.includes(rowLetter)
        ? existing.filter((r) => r !== rowLetter)
        : [...existing, rowLetter].sort()
      return { ...prev, aisleAfterRows: updated }
    })
    addHistory(`Toggled aisle after row ${rowLetter}`, 'green')
  }

  // ── Zoom ──
  const zoomIn = () => setZoom(z => Math.min(200, z + 10))
  const zoomOut = () => setZoom(z => Math.max(20, z - 10))
  const zoomFit = () => {
    if (!gridContainerRef.current) { setZoom(80); return }
    const panelWidth = gridContainerRef.current.clientWidth - 48
    const panelHeight = gridContainerRef.current.clientHeight - 48
    const gridWidth = layout.columns * 44
    const gridHeight = layout.rows * 44
    const fitZoom = Math.floor(Math.min(
      (panelWidth / gridWidth) * 100,
      (panelHeight / gridHeight) * 100,
      200
    ) / 10) * 10
    setZoom(Math.max(20, fitZoom))
  }

  // ── Pan tool: drag the canvas to scroll it ──
  const handlePanPointerDown = useCallback((e) => {
    if (!isPanMode || !gridContainerRef.current) return
    panRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      scrollLeft: gridContainerRef.current.scrollLeft,
      scrollTop: gridContainerRef.current.scrollTop,
    }
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }, [isPanMode])

  const handlePanPointerMove = useCallback((e) => {
    if (!panRef.current.active || !gridContainerRef.current) return
    gridContainerRef.current.scrollLeft = panRef.current.scrollLeft - (e.clientX - panRef.current.startX)
    gridContainerRef.current.scrollTop = panRef.current.scrollTop - (e.clientY - panRef.current.startY)
  }, [])

  const handlePanPointerUp = useCallback(() => {
    panRef.current.active = false
  }, [])

  // ── Seat summary ──
  const seatSummary = useMemo(() => ({
    total:    layout.seats.filter(s => !s.isBlocked).length,
    premium:  layout.seats.filter(s => s.type === 'premium' && !s.isBlocked).length,
    gold:     layout.seats.filter(s => s.type === 'gold' && !s.isBlocked).length,
    silver:   layout.seats.filter(s => s.type === 'silver' && !s.isBlocked).length,
    blocked:  layout.seats.filter(s => s.isBlocked).length,
    selected: selectedSeats.size,
  }), [layout.seats, selectedSeats])

  const inspectedSeat = useMemo(() => {
    if (selectedSeats.size !== 1) return null
    const id = Array.from(selectedSeats)[0]
    return layout.seats.find(s => s.id === id) ?? null
  }, [selectedSeats, layout.seats])

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handler = (e) => {
      const ctrl = navigator.platform.startsWith('Mac') ? e.metaKey : e.ctrlKey
      if (ctrl && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo() }
      if (ctrl && e.shiftKey && e.key === 'z') { e.preventDefault(); redo() }
      if (ctrl && e.key === 'a') { e.preventDefault(); selectAll() }
      if (!ctrl && !e.shiftKey && e.key.toLowerCase() === 'h' && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
        e.preventDefault(); setIsPanMode(p => !p)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [undo, redo, selectAll])

  // ── Save ──
  const saveScreen = async () => {
    if (!screenName.trim()) { setSaveMessage("Please enter a screen name"); setShowSaveDialog(true); return }
    try {
      setLoading(true)
      const seatCounts = layout.seats.reduce(
        (acc, seat) => { if (seat.type in acc) acc[seat.type]++; return acc },
        { premium: 0, gold: 0, silver: 0 }
      )
      const screenData = {
        name: screenName,
        total_seats: seatCounts.premium + seatCounts.gold + seatCounts.silver,
        premium_seats: seatCounts.premium, gold_seats: seatCounts.gold, silver_seats: seatCounts.silver,
        premium_price: pricing.premium, gold_price: pricing.gold, silver_price: pricing.silver,
        layout, screen_position: layout.screenPosition, rows: layout.rows, columns: layout.columns,
      }
      if (isEditing) { await screensAPI.updateScreen(id, screenData); setSaveMessage("Screen updated successfully!") }
      else { await screensAPI.createScreen(screenData); setSaveMessage("Screen saved successfully!") }
      addHistory(isEditing ? 'Screen updated' : 'Screen saved', 'green')
      setShowSaveDialog(true)
    } catch (err) {
      setSaveMessage(err.message || "Failed to save screen")
      setShowSaveDialog(true)
    } finally {
      setLoading(false)
    }
  }

  const confirmSave = () => {
    setShowSaveDialog(false)
    if (!saveMessage.includes("Failed") && !saveMessage.includes("name")) navigate('/screens')
  }

  const resetLayout = () => setShowResetDialog(true)

  const confirmReset = () => {
    pushUndo()
    setLayout((prev) => ({ ...prev, aisleAfterColumns: [], aisleAfterRows: [] }))
    initializeSeats()
    setSelectedSeats(new Set())
    setRowLabels({})
    setShowResetDialog(false)
    addHistory('Grid reset', 'orange')
  }

  // ── Seat color ──
  const getSeatColor = (seat) => {
    const isSelected = selectedSeats.has(seat.id)
    const base = "transition-all duration-150 border-2"
    if (isSelected) return `${base} border-primary ring-2 ring-primary/30 scale-105 bg-primary/15`
    if (seat.isBlocked) return `${base} bg-destructive border-destructive text-destructive-foreground`
    switch (seat.type) {
      case "premium": return `${base} bg-seat-premium/90 border-seat-premium hover:bg-seat-premium text-seat-premium-foreground`
      case "gold":    return `${base} bg-seat-gold/90 border-seat-gold hover:bg-seat-gold text-seat-gold-foreground`
      case "silver":  return `${base} bg-seat-silver/90 border-seat-silver hover:bg-seat-silver text-seat-silver-foreground`
      case "entrance":return `${base} bg-gradient-to-br from-green-400 to-green-500 border-green-600 text-green-900`
      case "door":    return `${base} bg-gradient-to-br from-orange-400 to-orange-500 border-orange-600 text-orange-900`
      default:        return `${base} bg-muted border-border`
    }
  }

  const tools = [
    { id: "premium",  label: "Premium",      icon: "💎", color: "bg-seat-premium" },
    { id: "gold",     label: "Gold",          icon: "🥇", color: "bg-seat-gold" },
    { id: "silver",   label: "Silver",        icon: "🥈", color: "bg-seat-silver" },
    { id: "aisle",    label: "Aisle",         icon: "↔",  color: "border-2 border-dashed border-primary/40 bg-primary/5" },
    { id: "entrance", label: "Entrance",      icon: "🚪", color: "bg-gradient-to-r from-green-400 to-green-500" },
    { id: "door",     label: "Door",          icon: "🔓", color: "bg-gradient-to-r from-orange-400 to-orange-500" },
    { id: "block",    label: "Block/Unblock", icon: "❌", color: "bg-destructive" },
  ]

  // ── Seat grid (reused in both main canvas and preview) ──
  const renderGrid = (readOnly = false) => (
    <div className="inline-block min-w-full">
      {/* Column headers */}
      <div className="flex items-center gap-1 mb-2">
        <div className="w-12" />
        {Array.from({ length: layout.columns }, (_, colIndex) => {
          const colNumber = colIndex + 1
          const hasAisle = (layout.aisleAfterColumns || []).includes(colNumber)
          return (
            <React.Fragment key={colIndex}>
              <button
                className={`w-10 h-6 text-xs font-medium rounded transition-colors ${
                  readOnly ? "bg-secondary/50 cursor-default" :
                  selectedTool === "aisle"
                    ? hasAisle
                      ? "bg-primary/20 border border-primary/50 text-primary dark:bg-primary/30"
                      : "bg-primary/5 hover:bg-primary/10 border border-dashed border-primary/30 text-primary/80"
                    : "bg-secondary/50 hover:bg-secondary"
                }`}
                onClick={() => {
                  if (readOnly || isPanMode) return
                  selectedTool === "aisle" ? toggleAisleAfterColumn(colNumber) : selectFullColumn(colIndex)
                }}
                title={readOnly ? String(colNumber) : selectedTool === "aisle" ? `${hasAisle ? 'Remove' : 'Add'} aisle after col ${colNumber}` : `Select column ${colNumber}`}
              >
                {colNumber}
              </button>
              {hasAisle && colIndex < layout.columns - 1 && (
                <div className="w-5 flex items-center justify-center opacity-50">
                  <div className="w-0.5 h-4 bg-primary/50 rounded" />
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
              <div className="flex items-center gap-1">
                <button
                  className={`w-6 h-10 text-xs font-medium rounded transition-colors ${
                    readOnly ? "bg-secondary/50 cursor-default" :
                    selectedTool === "aisle"
                      ? hasAisleAfterRow
                        ? "bg-primary/20 border border-primary/50 text-primary"
                        : "bg-primary/5 hover:bg-primary/10 border border-dashed border-primary/30 text-primary/80"
                      : "bg-secondary/50 hover:bg-secondary"
                  }`}
                  onClick={() => {
                    if (readOnly || isPanMode) return
                    selectedTool === "aisle" ? toggleAisleAfterRow(rowLabel) : selectFullRow(rowIndex)
                  }}
                  title={readOnly ? rowLabel : selectedTool === "aisle" ? `${hasAisleAfterRow ? 'Remove' : 'Add'} aisle after row ${rowLabel}` : `Select row ${rowLabel}`}
                >
                  ⬌
                </button>
                <div className={`w-4 text-center font-bold text-sm ${hasAisleAfterRow ? "text-primary" : ""}`}>
                  {rowLabel}
                </div>
              </div>

              {Array.from({ length: layout.columns }, (_, colIndex) => {
                const colNumber = colIndex + 1
                const hasAisleAfterCol = (layout.aisleAfterColumns || []).includes(colNumber)
                const seat = layout.seats.find((s) => s.id === `${rowIndex}-${colIndex}`)
                return (
                  <React.Fragment key={`${rowIndex}-${colIndex}`}>
                    {seat ? (
                      <button
                        className={`w-10 h-10 rounded-lg text-xs font-bold ${getSeatColor(seat)} ${readOnly ? "cursor-default" : "hover:scale-105 active:scale-95"}`}
                        onClick={(e) => !readOnly && !isPanMode && handleSeatClick(seat, e)}
                        title={`${seat.row}${seat.column} — ${seat.type}${seat.price ? ` — ₹${seat.price}` : ""}`}
                      >
                        {seat.type === "entrance" || seat.type === "door"
                          ? <DoorOpen className="h-4 w-4 mx-auto" />
                          : seat.isBlocked ? "✕" : seat.column}
                      </button>
                    ) : (
                      <div className="w-10 h-10" />
                    )}
                    {hasAisleAfterCol && colIndex < layout.columns - 1 && (
                      <div className="w-5 flex items-center justify-center opacity-50">
                        <div className="w-0.5 h-8 bg-primary/50 rounded" />
                      </div>
                    )}
                  </React.Fragment>
                )
              })}
            </div>
            {hasAisleAfterRow && (
              <div className="flex items-center gap-1 my-1">
                <div className="w-12" />
                <div className="flex-1 h-0.5 bg-primary/40 rounded opacity-70" />
              </div>
            )}
          </React.Fragment>
        )
      })}
    </div>
  )

  return (
    <div className="flex flex-col h-full">

      {/* ── STICKY INNER NAVBAR ── */}
      <div className="sticky top-0 z-40 flex items-center gap-3 px-4 py-2 border-b bg-background/95 backdrop-blur shrink-0">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/screens')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="font-semibold text-sm">Screen Designer</span>
        {screenName && <Badge variant="secondary" className="text-xs font-medium">{screenName}</Badge>}

        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={clearSelection}>
            Clear Selection
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={resetLayout}>
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Reset Grid
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setShowPreviewDialog(true)}>
            <Eye className="h-3.5 w-3.5 mr-1" />
            Preview
          </Button>
          <Button
            size="sm"
            className="h-8 text-xs bg-green-600 hover:bg-green-700 text-white"
            onClick={saveScreen}
            disabled={loading}
          >
            {loading
              ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              : <Save className="h-3.5 w-3.5 mr-1" />}
            Save Screen
          </Button>
        </div>
      </div>

      {/* ── THREE-COLUMN BODY ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── LEFT PANEL ── */}
        <aside className="w-[240px] shrink-0 border-r overflow-y-auto p-3 space-y-4">

          {/* SCREEN SETTINGS */}
          <section className="space-y-3">
            <p className="text-[10px] font-semibold text-muted-foreground tracking-widest uppercase">Screen Settings</p>
            <div>
              <Label className="text-xs font-medium">Screen Name</Label>
              <Input
                value={screenName}
                onChange={(e) => setScreenName(e.target.value)}
                placeholder="e.g., IMAX Screen 1"
                className="mt-1 h-8 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-medium">Rows</Label>
                <Input
                  type="number" value={inputRows} min="1" max="20"
                  className="mt-1 h-8 text-sm"
                  onChange={(e) => {
                    const val = Math.min(20, Math.max(1, parseInt(e.target.value) || 1))
                    setInputRows(val)
                    clearTimeout(rowsTimerRef.current)
                    rowsTimerRef.current = setTimeout(() => setLayout(p => ({ ...p, rows: val })), 600)
                  }}
                />
              </div>
              <div>
                <Label className="text-xs font-medium">Columns</Label>
                <Input
                  type="number" value={inputColumns} min="1" max="30"
                  className="mt-1 h-8 text-sm"
                  onChange={(e) => {
                    const val = Math.min(30, Math.max(1, parseInt(e.target.value) || 1))
                    setInputColumns(val)
                    clearTimeout(colsTimerRef.current)
                    colsTimerRef.current = setTimeout(() => setLayout(p => ({ ...p, columns: val })), 600)
                  }}
                />
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium">Screen Position</Label>
              <Select value={layout.screenPosition} onValueChange={(v) => setLayout(p => ({ ...p, screenPosition: v }))}>
                <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="top">Top</SelectItem>
                  <SelectItem value="bottom">Bottom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </section>

          <Separator />

          {/* SEAT SUMMARY */}
          <section className="space-y-2">
            <p className="text-[10px] font-semibold text-muted-foreground tracking-widest uppercase">Seat Summary</p>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { label: 'TOTAL',    value: seatSummary.total,    cls: 'text-foreground' },
                { label: 'PREMIUM',  value: seatSummary.premium,  cls: 'text-seat-premium' },
                { label: 'GOLD',     value: seatSummary.gold,     cls: 'text-seat-gold' },
                { label: 'SILVER',   value: seatSummary.silver,   cls: 'text-seat-silver' },
                { label: 'BLOCKED',  value: seatSummary.blocked,  cls: 'text-destructive' },
                { label: 'SELECTED', value: seatSummary.selected, cls: 'text-primary' },
              ].map(({ label, value, cls }) => (
                <div key={label} className="flex flex-col items-center justify-center rounded-md border p-1.5 text-center">
                  <span className={`text-base font-bold leading-none ${cls}`}>{value}</span>
                  <span className="text-[9px] text-muted-foreground mt-0.5 font-medium">{label}</span>
                </div>
              ))}
            </div>
          </section>

          <Separator />

          {/* PRICING */}
          <section className="space-y-2">
            <p className="text-[10px] font-semibold text-muted-foreground tracking-widest uppercase">Pricing (₹)</p>
            {Object.entries(pricing).map(([type, price]) => (
              <div key={type} className="flex items-center gap-2">
                <Label className="text-xs font-medium capitalize w-14 shrink-0">{type}</Label>
                <Input
                  type="number" value={price}
                  className="h-7 text-sm"
                  onChange={(e) => setPricing(p => ({ ...p, [type]: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            ))}
          </section>

          <Separator />

          {/* SELECTION MODE */}
          <section className="space-y-2">
            <p className="text-[10px] font-semibold text-muted-foreground tracking-widest uppercase">Selection Mode</p>
            <div className="flex gap-1">
              {[
                { id: "single", label: "Single", Icon: MousePointer },
                { id: "multi",  label: "Multi",  Icon: Square },
                { id: "row",    label: "Row",     Icon: null },
              ].map(({ id, label, Icon }) => (
                <Button
                  key={id}
                  variant={selectionMode === id ? "default" : "outline"}
                  size="sm"
                  className="flex-1 h-7 text-xs px-1"
                  onClick={() => setSelectionMode(id)}
                >
                  {Icon && <Icon className="h-3 w-3 mr-1" />}
                  {label}
                </Button>
              ))}
            </div>
            {selectionMode === "row" && (
              <p className="text-[10px] text-muted-foreground">Click any seat to select its entire row.</p>
            )}
          </section>

          <Separator />

          {/* TOOLS */}
          <section className="space-y-1.5">
            <p className="text-[10px] font-semibold text-muted-foreground tracking-widest uppercase">Tools</p>
            {tools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => setSelectedTool(tool.id)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium transition-all border ${
                  selectedTool === tool.id
                    ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
                    : "border-transparent hover:bg-muted text-foreground"
                }`}
              >
                <span className="text-sm">{tool.icon}</span>
                <span className="flex-1 text-left">{tool.label}</span>
                {tool.id in pricing && (
                  <span className="text-[10px] text-muted-foreground">₹{pricing[tool.id]}</span>
                )}
              </button>
            ))}
          </section>
        </aside>

        {/* ── CENTER PANEL ── */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* ZOOM / HISTORY BAR */}
          <div className="shrink-0 flex items-center gap-1.5 px-4 py-2 border-b bg-muted/20 text-xs">
            <span className="text-[10px] font-semibold text-muted-foreground tracking-widest uppercase mr-1">Layout</span>
            <Button variant="outline" size="icon" className="h-6 w-6 text-xs" onClick={zoomOut}>−</Button>
            <span className="font-mono w-10 text-center text-xs">{zoom}%</span>
            <Button variant="outline" size="icon" className="h-6 w-6 text-xs" onClick={zoomIn}>+</Button>
            <Button variant="outline" size="sm" className="h-6 text-xs px-2" onClick={zoomFit}>Fit</Button>
            <Separator orientation="vertical" className="h-4 mx-1" />
            <Button
              variant={isPanMode ? "default" : "outline"}
              size="icon"
              className="h-6 w-6 text-xs"
              onClick={() => setIsPanMode(p => !p)}
              title="Pan tool — drag the canvas to move around"
            >
              <Hand className="h-3.5 w-3.5" />
            </Button>
            <Separator orientation="vertical" className="h-4 mx-1" />
            <Button variant="ghost" size="sm" className="h-6 text-xs px-2 gap-1" onClick={undo} disabled={undoStack.length === 0}>
              <Undo2 className="h-3 w-3" /> Undo
            </Button>
            <Button variant="ghost" size="sm" className="h-6 text-xs px-2 gap-1" onClick={redo} disabled={redoStack.length === 0}>
              <Redo2 className="h-3 w-3" /> Redo
            </Button>
            <Separator orientation="vertical" className="h-4 mx-1" />
            <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={selectAll}>
              Select All
            </Button>
          </div>

          {/* CANVAS */}
          <div
            ref={gridContainerRef}
            className={`flex-1 overflow-auto p-6 ${isPanMode ? "cursor-grab active:cursor-grabbing select-none" : ""}`}
            onPointerDown={handlePanPointerDown}
            onPointerMove={handlePanPointerMove}
            onPointerUp={handlePanPointerUp}
            onPointerLeave={handlePanPointerUp}
          >
            <div
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center', transition: 'transform 0.15s ease' }}
              className="block w-max mx-auto"
            >
              {/* Screen top */}
              {layout.screenPosition === "top" && (
                <div className="flex flex-col items-center mb-6">
                  <div className="bg-gradient-to-b from-gray-700 to-gray-900 text-white px-16 py-2 rounded-t-2xl shadow-lg flex flex-col items-center gap-1 w-64 relative z-10">
                    <span className="text-[10px] text-gray-400 tracking-widest">▲ SCREEN / STAGE</span>
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4 text-gray-300" />
                      <span className="text-sm font-bold tracking-widest text-gray-100">SCREEN</span>
                    </div>
                  </div>
                  <div className="w-64 h-3 bg-gradient-to-b from-primary/25 to-transparent blur-md -mt-1 rounded-b-full" />
                </div>
              )}

              {/* Aisle hint */}
              {selectedTool === "aisle" && (
                <div className="flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg bg-primary/5 dark:bg-primary/10 border border-dashed border-primary/30 text-primary text-xs mb-4">
                  <span>↔</span>
                  <span>Click a <strong>column number</strong> to toggle a vertical aisle. Click <strong>⬌</strong> to toggle a horizontal aisle.</span>
                </div>
              )}

              {/* Grid */}
              <div className="overflow-auto p-2">
                {renderGrid(false)}
              </div>

              {/* Screen bottom */}
              {layout.screenPosition === "bottom" && (
                <div className="flex flex-col items-center mt-6">
                  <div className="w-64 h-3 bg-gradient-to-t from-primary/25 to-transparent blur-md -mb-1 rounded-t-full" />
                  <div className="bg-gradient-to-t from-gray-700 to-gray-900 text-white px-16 py-2 rounded-b-2xl shadow-lg flex flex-col items-center gap-1 w-64 relative z-10">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4 text-gray-300" />
                      <span className="text-sm font-bold tracking-widest text-gray-100">SCREEN</span>
                    </div>
                    <span className="text-[10px] text-gray-400 tracking-widest">▼ SCREEN / STAGE</span>
                  </div>
                </div>
              )}

              {/* Legend */}
              <div className="mt-6 p-3 rounded-lg border bg-muted/20">
                <div className="grid grid-cols-4 gap-2">
                  {tools.map((tool) => (
                    <div key={tool.id} className="flex items-center gap-1.5 text-xs">
                      <div className={`w-5 h-5 rounded ${tool.color} flex items-center justify-center text-[10px] shrink-0`}>
                        {tool.icon}
                      </div>
                      <span className="font-medium truncate">{tool.label}</span>
                      {tool.id in pricing && <span className="text-muted-foreground">₹{pricing[tool.id]}</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* ── RIGHT PANEL ── */}
        <aside className="w-[220px] shrink-0 border-l overflow-y-auto p-3 space-y-4">

          {/* SELECTED SEAT */}
          <section className="space-y-2">
            <p className="text-[10px] font-semibold text-muted-foreground tracking-widest uppercase">Selected Seat</p>
            {inspectedSeat ? (
              <div className="rounded-md border p-2.5 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Row</span>
                  <span className="font-semibold">{inspectedSeat.row}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Column</span>
                  <span className="font-semibold">{inspectedSeat.column}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Type</span>
                  <Badge variant="outline" className="text-[10px] capitalize">{inspectedSeat.type}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price</span>
                  <span className="font-semibold">{inspectedSeat.price ? `₹${inspectedSeat.price}` : '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Blocked</span>
                  <span className={inspectedSeat.isBlocked ? 'text-destructive font-semibold' : 'text-green-600 font-semibold'}>
                    {inspectedSeat.isBlocked ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4 rounded-md border border-dashed">
                No seat selected.<br />Click a seat to inspect.
              </p>
            )}
          </section>

          <Separator />

          {/* QUICK APPLY */}
          <section className="space-y-2">
            <p className="text-[10px] font-semibold text-muted-foreground tracking-widest uppercase">Quick Apply</p>
            <Button variant="outline" size="sm" className="w-full h-7 text-xs" onClick={fillSelectedRow}>
              Fill Selected Row
            </Button>
            <Button variant="outline" size="sm" className="w-full h-7 text-xs" onClick={applyToAllSelected}>
              Apply to All Selected
            </Button>
            <Button variant="destructive" size="sm" className="w-full h-7 text-xs" onClick={clearSelection}>
              Clear Selected
            </Button>
          </section>

          <Separator />

          {/* HISTORY */}
          <section className="space-y-2">
            <p className="text-[10px] font-semibold text-muted-foreground tracking-widest uppercase">History</p>
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {historyLog.length === 0 && (
                <p className="text-xs text-muted-foreground">No actions yet.</p>
              )}
              {historyLog.map((entry, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <div className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${historyColorClass[entry.color] ?? 'bg-gray-400'}`} />
                  <div className="min-w-0">
                    <p className="text-foreground leading-tight truncate">{entry.label}</p>
                    <p className="text-muted-foreground text-[10px]">{formatTime(entry.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <Separator />

          {/* KEYBOARD SHORTCUTS */}
          <section className="space-y-2">
            <p className="text-[10px] font-semibold text-muted-foreground tracking-widest uppercase">Keyboard Shortcuts</p>
            <div className="space-y-1.5">
              {[
                ['Undo',         '⌘Z'],
                ['Redo',         '⌘⇧Z'],
                ['Select All',   '⌘A'],
                ['Multi-select', '⌘+Click'],
                ['Row select',   '⇧+Click'],
                ['Pan tool',     'H'],
              ].map(([action, key]) => (
                <div key={action} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{action}</span>
                  <kbd className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded border border-border">{key}</kbd>
                </div>
              ))}
            </div>
          </section>

        </aside>
      </div>

      {/* ── DIALOGS ── */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{saveMessage.includes("name") || saveMessage.includes("Failed") ? "Error" : "Success"}</DialogTitle>
            <DialogDescription>{saveMessage}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            {saveMessage.includes("name") || saveMessage.includes("Failed")
              ? <Button onClick={() => setShowSaveDialog(false)}>OK</Button>
              : <Button onClick={confirmSave}>Continue</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Layout</DialogTitle>
            <DialogDescription>This will remove all seat configurations and aisles. This action can be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmReset}>
              <RotateCcw className="h-4 w-4 mr-2" /> Reset Layout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Layout Preview — {screenName || "Untitled Screen"}</DialogTitle>
            <DialogDescription>{seatSummary.total} seats · {seatSummary.premium} premium · {seatSummary.gold} gold · {seatSummary.silver} silver</DialogDescription>
          </DialogHeader>
          <div className="overflow-auto py-4">
            <div style={{ transform: 'scale(0.7)', transformOrigin: 'top center' }} className="inline-block min-w-full">
              {layout.screenPosition === "top" && (
                <div className="flex flex-col items-center mb-6">
                  <div className="bg-gradient-to-b from-gray-700 to-gray-900 text-white px-16 py-2 rounded-t-2xl flex items-center gap-2 w-64 justify-center relative z-10">
                    <Monitor className="h-4 w-4 text-gray-300" />
                    <span className="text-sm font-bold tracking-widest text-gray-100">SCREEN</span>
                  </div>
                  <div className="w-64 h-3 bg-gradient-to-b from-primary/25 to-transparent blur-md -mt-1 rounded-b-full" />
                </div>
              )}
              {renderGrid(true)}
              {layout.screenPosition === "bottom" && (
                <div className="flex flex-col items-center mt-6">
                  <div className="w-64 h-3 bg-gradient-to-t from-primary/25 to-transparent blur-md -mb-1 rounded-t-full" />
                  <div className="bg-gradient-to-t from-gray-700 to-gray-900 text-white px-16 py-2 rounded-b-2xl flex items-center gap-2 w-64 justify-center relative z-10">
                    <Monitor className="h-4 w-4 text-gray-300" />
                    <span className="text-sm font-bold tracking-widest text-gray-100">SCREEN</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}

export default ScreenDesignerPage
