import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Skeleton } from "@/components/ui/skeleton"
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

const EditShowPage = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [screens, setScreens] = useState([])
  const [isLoading, setIsLoading] = useState(true)
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
    const fetchData = async () => {
      try {
        const [showData, screenData] = await Promise.all([
          showsAPI.getShowById(id),
          screensAPI.getMyScreens(),
        ])

        setScreens(screenData || [])

        const { movie, screen, show_details } = showData
        setFormData({
          movie_id: movie.id || "",
          screen_id: screen.id || "",
          show_date: show_details.show_date || "",
          start_time: show_details.start_time || "",
          end_time: show_details.end_time || "",
          language_version: show_details.language_version || "",
          price_override: {
            premium: show_details.price_override?.premium ?? "",
            gold: show_details.price_override?.gold ?? "",
            silver: show_details.price_override?.silver ?? "",
          },
        })
      } catch (err) {
        toast.error("Failed to load show details")
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [id])

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
      await showsAPI.editShow(id, formData)
      toast.success("Show updated successfully!")
      navigate("/shows")
    } catch (err) {
      toast.error(err.message || "Failed to update show")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-6 space-y-5">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-md" />
          <div className="space-y-1">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
        </div>
        <Card>
          <CardContent className="pt-6 space-y-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/shows")} type="button">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit Show</h1>
          <p className="text-sm text-muted-foreground">Update the details for this show</p>
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
                onMovieSelect={(movie) =>
                  setFormData((prev) => ({
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
                value={formData.screen_id}
                onValueChange={(val) => setFormData((prev) => ({ ...prev, screen_id: val }))}
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
            {/* <div className="space-y-2">
              <Label>Show Date</Label>
              <Input
                type="date"
                value={formData.show_date ? dayjs(formData.show_date).tz("Asia/Kolkata").format("YYYY-MM-DD") : ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, show_date: e.target.value }))}
                required
              />
            </div> */}
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
              <Input
                value={formData.language_version}
                onChange={(e) => setFormData((prev) => ({ ...prev, language_version: e.target.value }))}
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
                      value={formData.price_override[tier]}
                      onChange={(e) => handlePriceChange(tier, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={() => navigate("/shows")}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Update Show"}
              </Button>
            </div>

          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default EditShowPage
