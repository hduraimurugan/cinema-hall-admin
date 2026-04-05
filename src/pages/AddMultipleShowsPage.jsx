import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { ArrowLeft, Plus, Trash2, CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { screensAPI, showsAPI } from "@/services/api"
import MovieSearchDropdown from "@/components/MovieSearchDropdown"
import { toast } from "sonner"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"

dayjs.extend(utc)
dayjs.extend(timezone)

const TIME_PRESETS = [
  { label: "Morning",    start_time: "09:00", end_time: "11:15" },
  { label: "Matinee",    start_time: "11:45", end_time: "14:15" },
  { label: "Afternoon",  start_time: "14:30", end_time: "17:15" },
  { label: "Evening",    start_time: "18:30", end_time: "21:45" },
  { label: "Night",      start_time: "22:30", end_time: "01:15" },
]

const AddMultipleShowsPage = () => {
  const navigate = useNavigate()
  const [screens, setScreens] = useState([])
  const [movieLanguages, setMovieLanguages] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [sharedData, setSharedData] = useState({
    movie_id: "",
    screen_id: "",
    language_version: "",
    price_override: { premium: "", gold: "", silver: "" },
  })

  const [dateRange, setDateRange] = useState({ from: null, to: null })
  const [timeSlots, setTimeSlots] = useState([{ start_time: "", end_time: "" }])

  useEffect(() => {
    const fetchScreens = async () => {
      try {
        const data = await screensAPI.getMyScreens()
        setScreens(data || [])
      } catch (err) {
        console.error("Error fetching screens:", err)
      }
    }
    fetchScreens()
  }, [])

  const handleScreenChange = (screenId) => {
    const screen = screens.find((s) => s.id === screenId)
    setSharedData((prev) => ({
      ...prev,
      screen_id: screenId,
      price_override: {
        premium: screen?.premium_price ?? "",
        gold: screen?.gold_price ?? "",
        silver: screen?.silver_price ?? "",
      },
    }))
  }

  const handlePriceChange = (tier, value) => {
    setSharedData((prev) => ({
      ...prev,
      price_override: { ...prev.price_override, [tier]: value },
    }))
  }

  const addTimeSlot = () => {
    setTimeSlots((prev) => [...prev, { start_time: "", end_time: "" }])
  }

  const removeTimeSlot = (index) => {
    setTimeSlots((prev) => prev.filter((_, i) => i !== index))
  }

  const updateTimeSlot = (index, field, value) => {
    setTimeSlots((prev) => prev.map((slot, i) => (i === index ? { ...slot, [field]: value } : slot)))
  }

  const togglePreset = (preset) => {
    const exists = timeSlots.some(
      (s) => s.start_time === preset.start_time && s.end_time === preset.end_time
    )
    if (exists) {
      // Remove matching slot (keep at least 1 empty if it's the last)
      const filtered = timeSlots.filter(
        (s) => !(s.start_time === preset.start_time && s.end_time === preset.end_time)
      )
      setTimeSlots(filtered.length > 0 ? filtered : [{ start_time: "", end_time: "" }])
    } else {
      // Fill first empty slot, or append
      const emptyIndex = timeSlots.findIndex((s) => !s.start_time && !s.end_time)
      if (emptyIndex !== -1) {
        setTimeSlots((prev) =>
          prev.map((s, i) => (i === emptyIndex ? { start_time: preset.start_time, end_time: preset.end_time } : s))
        )
      } else {
        setTimeSlots((prev) => [...prev, { start_time: preset.start_time, end_time: preset.end_time }])
      }
    }
  }

  const isPresetActive = (preset) =>
    timeSlots.some((s) => s.start_time === preset.start_time && s.end_time === preset.end_time)

  // Generate all dates in range (inclusive)
  const getDateRange = () => {
    if (!dateRange.from) return []
    const dates = []
    let cur = dayjs(dateRange.from)
    const end = dayjs(dateRange.to ?? dateRange.from)
    while (!cur.isAfter(end)) {
      dates.push(cur.format("YYYY-MM-DD"))
      cur = cur.add(1, "day")
    }
    return dates
  }


  const filledSlots = timeSlots.filter((s) => s.start_time && s.end_time)
  const numDates = getDateRange().length
  const totalShows = numDates * filledSlots.length

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (filledSlots.length === 0) {
      toast.error("Add at least one time slot with start and end time")
      return
    }
    if (numDates === 0) {
      toast.error("Select a show date or date range")
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        movie_id: sharedData.movie_id,
        screen_ids: [sharedData.screen_id],
        dates: getDateRange(),
        time_slots: filledSlots,
        language_version: sharedData.language_version,
        price_override: sharedData.price_override,
      }
      const result = await showsAPI.createMultipleShows(payload)
      const count = result.shows?.length ?? totalShows
      const skipped = result.skipped?.length ?? 0
      if (count === 0) {
        toast.warning("No shows created — all slots already exist or conflict")
      } else if (skipped > 0) {
        toast.success(`${count} show${count !== 1 ? "s" : ""} created, ${skipped} skipped (already exist)`)
      } else {
        toast.success(`${count} show${count !== 1 ? "s" : ""} created successfully!`)
      }
      navigate("/shows")
    } catch (err) {
      toast.error(err.message || "Failed to create shows")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="px-6 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/shows")} type="button">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Add Multiple Shows</h1>
          <p className="text-sm text-muted-foreground">Schedule several time slots for one movie in one go</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        <div className="grid grid-cols-2 gap-5 items-start">

        {/* Shared Details Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Show Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">

            {/* Movie */}
            <div className="space-y-2">
              <Label>Movie</Label>
              <MovieSearchDropdown
                selectedMovieId={sharedData.movie_id}
                onMovieSelect={(movie) => {
                  const langs = movie.language || []
                  setMovieLanguages(langs)
                  setSharedData((prev) => ({
                    ...prev,
                    movie_id: movie.id,
                    language_version: langs.length === 1 ? langs[0] : "",
                  }))
                }}
              />
            </div>

            {/* Screen */}
            <div className="space-y-2">
              <Label>Screen</Label>
              <Select value={sharedData.screen_id} onValueChange={handleScreenChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select screen" />
                </SelectTrigger>
                <SelectContent>
                  {screens.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} ({s.total_seats} seats)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Show Date Range */}
            <div className="space-y-2">
              <Label>Show Date</Label>
              <div className="grid grid-cols-2 gap-3">
                {/* From */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">From</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dateRange.from && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange.from ? dayjs(dateRange.from).format("MMM D, YYYY") : "Start date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateRange.from ?? undefined}
                        onSelect={(date) =>
                          setDateRange((prev) => ({
                            from: date ?? null,
                            to: prev.to && date && dayjs(prev.to).isBefore(dayjs(date)) ? null : prev.to,
                          }))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* To */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">To</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dateRange.to && "text-muted-foreground"
                        )}
                        disabled={!dateRange.from}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange.to ? dayjs(dateRange.to).format("MMM D, YYYY") : "End date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateRange.to ?? undefined}
                        onSelect={(date) => setDateRange((prev) => ({ ...prev, to: date ?? null }))}
                        disabled={(date) => dateRange.from ? dayjs(date).isBefore(dayjs(dateRange.from), "day") : false}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              {numDates > 1 && (
                <p className="text-xs text-muted-foreground">{numDates} dates selected</p>
              )}
            </div>

            {/* Language Version */}
            <div className="space-y-2">
              <Label>Language Version</Label>
              {movieLanguages.length > 1 ? (
                <Select
                  value={sharedData.language_version}
                  onValueChange={(val) => setSharedData((prev) => ({ ...prev, language_version: val }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {movieLanguages.map((lang) => (
                      <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={sharedData.language_version}
                  onChange={(e) => setSharedData((prev) => ({ ...prev, language_version: e.target.value }))}
                  placeholder="e.g., Tamil"
                  required
                />
              )}
            </div>

            {/* Price Override */}
            <div className="space-y-3">
              <Label>Price Override</Label>
              <div className="grid grid-cols-3 gap-3">
                {["premium", "gold", "silver"].map((tier) => (
                  <div key={tier} className="space-y-1">
                    <Label className="text-xs capitalize">{tier}</Label>
                    <Input
                      type="number"
                      placeholder="₹"
                      value={sharedData.price_override[tier]}
                      onChange={(e) => handlePriceChange(tier, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>

          </CardContent>
        </Card>

        {/* Time Slots Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Time Slots</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addTimeSlot} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Add Slot
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* Preset chips */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Quick add</Label>
              <div className="flex flex-wrap gap-2">
                {TIME_PRESETS.map((preset) => {
                  const active = isPresetActive(preset)
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => togglePreset(preset)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                        active
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-transparent text-muted-foreground hover:border-primary/50 hover:text-foreground"
                      )}
                    >
                      {active && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                      {preset.label}
                      <span className="opacity-60">{preset.start_time}–{preset.end_time}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Manual slots */}
            <div className="space-y-3">
              {timeSlots.map((slot, index) => (
                <div key={index} className="flex items-end gap-3">
                  <div className="flex-1 space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Slot {index + 1} — Start</Label>
                    <Input
                      type="time"
                      value={slot.start_time}
                      onChange={(e) => updateTimeSlot(index, "start_time", e.target.value)}
                    />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <Label className="text-xs text-muted-foreground">End</Label>
                    <Input
                      type="time"
                      value={slot.end_time}
                      onChange={(e) => updateTimeSlot(index, "end_time", e.target.value)}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive mb-0.5"
                    onClick={() => removeTimeSlot(index)}
                    disabled={timeSlots.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground pt-1">
              {numDates > 0 && filledSlots.length > 0 ? (
                <>
                  {numDates} date{numDates !== 1 ? "s" : ""} × {filledSlots.length} slot{filledSlots.length !== 1 ? "s" : ""}{" "}
                  → <span className="font-medium text-foreground">{totalShows} show{totalShows !== 1 ? "s" : ""}</span> will be created
                </>
              ) : (
                <>
                  {filledSlots.length} slot{filledSlots.length !== 1 ? "s" : ""} → {filledSlots.length} show{filledSlots.length !== 1 ? "s" : ""} will be created
                </>
              )}
            </p>
          </CardContent>
        </Card>

        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            className="min-w-[120px] bg-transparent"
            onClick={() => navigate("/shows")}
          >
            Cancel
          </Button>
          <Button type="submit" className="min-w-[120px]" disabled={isSubmitting}>
            {isSubmitting
              ? "Creating..."
              : `Create ${totalShows > 0 ? totalShows : filledSlots.length} Show${(totalShows > 1 || (totalShows === 0 && filledSlots.length !== 1)) ? "s" : ""}`}
          </Button>
        </div>

      </form>
    </div>
  )
}

export default AddMultipleShowsPage
