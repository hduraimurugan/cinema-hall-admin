import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { ArrowLeft, CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { screensAPI, showsAPI } from "@/services/api"
import MovieSearchDropdown from "@/components/MovieSearchDropdown"
import { toast } from "sonner"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"

dayjs.extend(utc)
dayjs.extend(timezone)

const AddShowPage = () => {
  const navigate = useNavigate()
  const [screens, setScreens] = useState([])
  const [movieLanguages, setMovieLanguages] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    movie_id: "",
    screen_id: "",
    show_date: "",
    start_time: "",
    end_time: "",
    language_version: "",
    price_override: { premium: "", gold: "", silver: "" },
  })

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
    setFormData((prev) => ({
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
    setFormData((prev) => ({
      ...prev,
      price_override: { ...prev.price_override, [tier]: value },
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await showsAPI.createShow(formData)
      toast.success("Show added successfully!")
      navigate("/shows")
    } catch (err) {
      toast.error(err.message || "Failed to add show")
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
          <h1 className="text-2xl font-bold">Add New Show</h1>
          <p className="text-sm text-muted-foreground">Schedule a new show for your cinema</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Movie */}
            <div className="space-y-2">
              <Label>Movie</Label>
              <MovieSearchDropdown
                selectedMovieId={formData.movie_id}
                onMovieSelect={(movie) => {
                  const langs = movie.language || []
                  setMovieLanguages(langs)
                  setFormData((prev) => ({
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
              <Select
                value={formData.screen_id}
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
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.show_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.show_date
                      ? dayjs(formData.show_date).format("MMM D, YYYY")
                      : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.show_date ? dayjs(formData.show_date).toDate() : undefined}
                    onSelect={(date) =>
                      setFormData((prev) => ({
                        ...prev,
                        show_date: date ? dayjs(date).format("YYYY-MM-DD") : "",
                      }))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Start & End Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData((prev) => ({ ...prev, start_time: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData((prev) => ({ ...prev, end_time: e.target.value }))}
                  required
                />
              </div>
            </div>

            {/* Language Version */}
            <div className="space-y-2">
              <Label>Language Version</Label>
              {movieLanguages.length > 1 ? (
                <Select
                  value={formData.language_version}
                  onValueChange={(val) => setFormData((prev) => ({ ...prev, language_version: val }))}
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
                  value={formData.language_version}
                  onChange={(e) => setFormData((prev) => ({ ...prev, language_version: e.target.value }))}
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
                      value={formData.price_override[tier]}
                      onChange={(e) => handlePriceChange(tier, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="min-w-[120px] bg-transparent"
                onClick={() => navigate("/shows")}
              >
                Cancel
              </Button>
              <Button type="submit" className="min-w-[120px]" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Show"}
              </Button>
            </div>

          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default AddShowPage
