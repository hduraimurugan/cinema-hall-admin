import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Edit, Clock, MapPin, Trash2, Calendar, Play, CalendarPlus, ChevronLeft, ChevronRight } from "lucide-react"
import { LazyLoadImage } from "react-lazy-load-image-component"
import "react-lazy-load-image-component/src/effects/blur.css"
import { showsAPI } from "../services/api"
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { useNavigate } from "react-router-dom"

dayjs.extend(utc);
dayjs.extend(timezone);


// Utility functions
const formatTime = (timeString) => {
  const [hours, minutes] = timeString.split(":")
  const hour = Number.parseInt(hours)
  const ampm = hour >= 12 ? "PM" : "AM"
  const displayHour = hour % 12 || 12
  return `${displayHour}:${minutes} ${ampm}`
}

const formatDuration = (minutes) => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h ${mins}m`
}

const formatDateParts = (date) => ({
  dow: date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase(),
  day: date.getDate(),
  month: date.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
})

const getNextDates = (offset = 0) => {
  const dates = []
  for (let i = 0; i < 7; i++) {
    const date = new Date()
    date.setDate(date.getDate() + offset * 7 + i)
    dates.push(date)
  }
  return dates
}


// Main Shows Management Component
const ShowsManagement = () => {
  const navigate = useNavigate()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [weekOffset, setWeekOffset] = useState(0)
  const [showsData, setShowsData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const fetchShows = async (date) => {
    setIsLoading(true)
    try {
      const dateStr = date.toISOString().split("T")[0]
      const response = await showsAPI.getShowsByDate(dateStr)
      setShowsData(response)
    } catch (error) {
      console.error("Error fetching shows:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchShows(selectedDate)
  }, [selectedDate])

  const handleDeleteShow = async (showId) => {
    if (window.confirm("Are you sure you want to delete this show?")) {
      try {
        await showsAPI.deleteShow(showId)
        fetchShows(selectedDate)
      } catch (error) {
        console.error("Error deleting show:", error)
      }
    }
  }

  return (
    <div className="max-w-7xl mx-auto">

      {/* Header */}
      <div className="px-6 pt-6 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Shows Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your cinema shows and schedules</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/shows/bulk")} className="gap-2">
            <CalendarPlus className="h-4 w-4" />
            Add Multiple
          </Button>
          <Button onClick={() => navigate("/shows/new")} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Show
          </Button>
        </div>
      </div>

      {/* Date Selector shelf */}
      <div className="bg-card border-b border-border">
        <div className="px-6">
          {/* Week range label */}
          {(() => {
            const dates = getNextDates(weekOffset)
            const first = dates[0]
            const last = dates[6]
            const sameMonth = first.getMonth() === last.getMonth()
            const rangeLabel = sameMonth
              ? `${first.toLocaleDateString("en-US", { month: "long" })} ${first.getDate()} – ${last.getDate()}, ${last.getFullYear()}`
              : `${first.toLocaleDateString("en-US", { month: "short" })} ${first.getDate()} – ${last.toLocaleDateString("en-US", { month: "short" })} ${last.getDate()}, ${last.getFullYear()}`
            return (
              <p className="pt-3 pb-0 text-xs font-medium text-muted-foreground tracking-wide">{rangeLabel}</p>
            )
          })()}
          <div className="flex items-center gap-3 py-3">
            {/* Left arrow */}
            <button
              onClick={() => {
                const newOffset = weekOffset - 1
                setWeekOffset(newOffset)
                setSelectedDate(getNextDates(newOffset)[0])
              }}
              className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {/* Date pills */}
            <div className="flex gap-2">
              {getNextDates(weekOffset).map((date, index) => {
                const { dow, day, month } = formatDateParts(date)
                const isSelected = date.toDateString() === selectedDate.toDateString()
                return (
                  <button
                    key={index}
                    onClick={() => setSelectedDate(date)}
                    className={`w-14 flex-shrink-0 flex flex-col items-center justify-center py-2.5 rounded-lg transition-all duration-200 ${
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary/30"
                        : "border border-border text-foreground hover:border-primary hover:text-primary hover:bg-primary/5"
                    }`}
                  >
                    <span className="text-[10px] font-semibold tracking-wider leading-none">{dow}</span>
                    <span className="text-xl font-bold leading-tight mt-0.5">{day}</span>
                    <span className="text-[10px] font-semibold tracking-wider leading-none">{month}</span>
                  </button>
                )
              })}
            </div>

            {/* Right arrow */}
            <button
              onClick={() => {
                const newOffset = weekOffset + 1
                setWeekOffset(newOffset)
                setSelectedDate(getNextDates(newOffset)[0])
              }}
              className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Availability Legend */}
      <div className="px-6 py-2">
        <div className="flex items-center justify-end gap-4 text-xs font-semibold tracking-wide">
          <span className="flex items-center gap-1.5 text-green-600 dark:text-green-500">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
            AVAILABLE
          </span>
          <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-500">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
            FAST FILLING
          </span>
        </div>
      </div>

      {/* Shows Content */}
      <div className="px-6 py-3 pb-10">
        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2].map((i) => (
              <Card key={i} className="rounded-xl overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex space-x-4">
                    <Skeleton className="h-24 w-16 rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-1/3" />
                      <Skeleton className="h-4 w-1/4" />
                      <div className="flex gap-2 pt-1">
                        <Skeleton className="h-5 w-16 rounded-full" />
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3">
                    {[1, 2, 3].map((j) => (
                      <Skeleton key={j} className="h-16 w-28 rounded-lg" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : showsData?.grouped?.length > 0 ? (
          <div className="space-y-4">
            {showsData.grouped.map((movieGroup) => (
              <Card key={movieGroup.movie_id} className="rounded-xl overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex space-x-4">
                    {/* Poster */}
                    <div className="h-24 w-16 bg-secondary rounded-lg overflow-hidden flex-shrink-0 shadow-md">
                      {movieGroup.poster_url ? (
                        <LazyLoadImage
                          src={movieGroup.poster_url}
                          alt={movieGroup.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Play className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Movie info */}
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg mb-2 leading-tight">{movieGroup.title}</CardTitle>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDuration(movieGroup.duration)}
                        </span>
                        {movieGroup.genre?.map((g, i) => (
                          <Badge key={i} variant="secondary" className="text-xs rounded-full px-2.5">
                            {g}
                          </Badge>
                        ))}
                        {movieGroup.language?.map((lang, i) => (
                          <Badge key={i} variant="outline" className="text-xs rounded-full px-2.5">
                            {lang}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-3">
                    {[...movieGroup.shows]
                      .sort((a, b) => a.start_time.localeCompare(b.start_time))
                      .map((show) => (
                        <div key={show.id} className="group relative">
                          {/* Show time button — BookMyShow style */}
                          <button
                            className="flex flex-col items-center justify-center px-4 py-2.5 min-w-[110px] border border-green-500 rounded-lg text-green-700 dark:text-green-400 hover:border-primary hover:text-primary transition-colors duration-150"
                            onClick={() => navigate(`/show/${show.id}`)}
                          >
                            {/* Screen info */}
                            <span className="flex items-center gap-1 text-[10px] text-muted-foreground mb-0.5">
                              <MapPin className="h-2.5 w-2.5" />
                              <span className="truncate max-w-[80px]">{show.screen_name}</span>
                              <span className="text-border opacity-60">·</span>
                              <span>{show.total_seats}s</span>
                            </span>
                            {/* Time */}
                            <span className="font-bold text-sm leading-tight">
                              {formatTime(show.start_time)}
                            </span>
                            {/* Language & price */}
                            <span className="flex items-center justify-between w-full text-[10px] text-muted-foreground mt-0.5 gap-2">
                              <span className="truncate">{show.language_version}</span>
                              <span>₹{show.price_override?.silver ?? "—"}</span>
                            </span>
                          </button>

                          {/* Edit / Delete hover actions */}
                          <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10">
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-6 w-6 p-0"
                              onClick={() => navigate(`/shows/${show.id}/edit`)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-6 w-6 p-0"
                              onClick={() => handleDeleteShow(show.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="rounded-xl p-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No shows scheduled</h3>
            <p className="text-muted-foreground mb-4 text-sm">
              No shows are scheduled for this date. Add your first show to get started.
            </p>
            <Button onClick={() => navigate("/shows/new")} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Show
            </Button>
          </Card>
        )}
      </div>
    </div>
  )
}

export default ShowsManagement
