import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Plus, Trash2 } from "lucide-react"
import { screensAPI, showsAPI } from "@/services/api"
import MovieSearchDropdown from "@/components/MovieSearchDropdown"
import { toast } from "sonner"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"

dayjs.extend(utc)
dayjs.extend(timezone)

const AddMultipleShowsPage = () => {
  const navigate = useNavigate()
  const [screens, setScreens] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [sharedData, setSharedData] = useState({
    movie_id: "",
    screen_id: "",
    show_date: "",
    language_version: "",
    price_override: { premium: "", gold: "", silver: "" },
  })

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

  const handleSubmit = async (e) => {
    e.preventDefault()

    const filledSlots = timeSlots.filter((s) => s.start_time && s.end_time)
    if (filledSlots.length === 0) {
      toast.error("Add at least one time slot with start and end time")
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        movie_id: sharedData.movie_id,
        screen_ids: [sharedData.screen_id],
        dates: [sharedData.show_date],
        time_slots: filledSlots,
        language_version: sharedData.language_version,
        price_override: sharedData.price_override,
      }
      const result = await showsAPI.createMultipleShows(payload)
      const count = result.shows?.length ?? filledSlots.length
      toast.success(`${count} show${count !== 1 ? "s" : ""} created successfully!`)
      navigate("/shows")
    } catch (err) {
      toast.error(err.message || "Failed to create shows")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-6">
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
                onMovieSelect={(movie) =>
                  setSharedData((prev) => ({
                    ...prev,
                    movie_id: movie.id,
                    language_version: movie.language?.join(", ") || prev.language_version,
                  }))
                }
              />
            </div>

            {/* Screen */}
            <div className="space-y-2">
              <Label>Screen</Label>
              <Select
                value={sharedData.screen_id}
                onValueChange={handleScreenChange}
              >
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

            {/* Show Date */}
            <div className="space-y-2">
              <Label>Show Date</Label>
              <Input
                type="date"
                value={sharedData.show_date ? dayjs(sharedData.show_date).tz("Asia/Kolkata").format("YYYY-MM-DD") : ""}
                onChange={(e) => setSharedData((prev) => ({ ...prev, show_date: e.target.value }))}
                required
              />
            </div>

            {/* Language Version */}
            <div className="space-y-2">
              <Label>Language Version</Label>
              <Input
                value={sharedData.language_version}
                onChange={(e) => setSharedData((prev) => ({ ...prev, language_version: e.target.value }))}
                placeholder="e.g., Tamil, English"
                required
              />
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
          <CardContent className="space-y-3">
            {timeSlots.map((slot, index) => (
              <div key={index} className="flex items-end gap-3">
                <div className="flex-1 space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Slot {index + 1} — Start</Label>
                  <Input
                    type="time"
                    value={slot.start_time}
                    onChange={(e) => updateTimeSlot(index, "start_time", e.target.value)}
                    required
                  />
                </div>
                <div className="flex-1 space-y-1.5">
                  <Label className="text-xs text-muted-foreground">End</Label>
                  <Input
                    type="time"
                    value={slot.end_time}
                    onChange={(e) => updateTimeSlot(index, "end_time", e.target.value)}
                    required
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

            <p className="text-xs text-muted-foreground pt-1">
              {timeSlots.length} slot{timeSlots.length !== 1 ? "s" : ""} → {timeSlots.length} show{timeSlots.length !== 1 ? "s" : ""} will be created
            </p>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1 bg-transparent"
            onClick={() => navigate("/shows")}
          >
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : `Create ${timeSlots.length} Show${timeSlots.length !== 1 ? "s" : ""}`}
          </Button>
        </div>

      </form>
    </div>
  )
}

export default AddMultipleShowsPage
