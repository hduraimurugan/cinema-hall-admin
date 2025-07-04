"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Edit, Clock, MapPin, Trash2, Calendar, Search, Play } from "lucide-react"
import { LazyLoadImage } from "react-lazy-load-image-component"
import "react-lazy-load-image-component/src/effects/blur.css"
import { moviesAPI, screensAPI, showsAPI } from "../services/api"

// Utility functions
function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

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

// Movie Search Dropdown Component
const MovieSearchDropdown = ({ selectedMovieId, onMovieSelect, placeholder = "Select a movie" }) => {
  const [searchValue, setSearchValue] = useState("")
  const [movies, setMovies] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedMovie, setSelectedMovie] = useState(null)
  const [isInitialLoading, setIsInitialLoading] = useState(!!selectedMovieId)

  const debouncedSearch = useCallback(
    debounce(async (searchTerm) => {
      if (!searchTerm.trim()) {
        setMovies([])
        return
      }
      setIsLoading(true)
      try {
        const response = await moviesAPI.getAllMovies({
          search: searchTerm,
          limit: 10,
        })
        setMovies(response.movies || [])
      } catch (err) {
        console.error("Error fetching movies:", err)
        setMovies([])
      } finally {
        setIsLoading(false)
      }
    }, 300),
    []
  )

  // 🎯 Load selected movie if ID is passed (for editing etc.)
  useEffect(() => {
    const fetchSelectedMovie = async () => {
      if (!selectedMovieId) return setIsInitialLoading(false)

      try {
        console.log(selectedMovieId);
        
        const response = await moviesAPI.getMovieById(selectedMovieId)
        setSelectedMovie(response.movie || null)
      } catch (err) {
        console.error("Error fetching selected movie:", err)
      } finally {
        setIsInitialLoading(false)
      }
    }

    fetchSelectedMovie()
  }, [selectedMovieId])

  useEffect(() => {
    if (searchValue) {
      debouncedSearch(searchValue)
    }
  }, [searchValue, debouncedSearch])

  const handleMovieSelect = (movie) => {
    setSelectedMovie(movie)
    onMovieSelect(movie.id)
    setIsOpen(false)
    setSearchValue("")
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        className="w-full justify-between bg-transparent"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isInitialLoading}
      >
        {isInitialLoading ? "Loading movie..." : selectedMovie ? selectedMovie.title : placeholder}
        <Search className="h-4 w-4" />
      </Button>

      {isOpen && !isInitialLoading && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-50 max-h-64 overflow-hidden">
          <div className="p-2 border-b">
            <Input
              placeholder="Search movies..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {isLoading && (
              <div className="p-2 space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex space-x-2">
                    <Skeleton className="h-12 w-8 rounded" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!isLoading && movies.length === 0 && searchValue && (
              <div className="p-4 text-center text-muted-foreground">No movies found</div>
            )}
            {!isLoading &&
              movies.map((movie) => (
                <div
                  key={movie.id}
                  className="p-2 hover:bg-accent cursor-pointer flex space-x-2"
                  onClick={() => handleMovieSelect(movie)}
                >
                  <div className="h-12 w-8 bg-secondary rounded overflow-hidden flex-shrink-0">
                    {movie.poster_url ? (
                      <LazyLoadImage src={movie.poster_url} alt={movie.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Play className="h-3 w-3 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{movie.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {movie.genre?.join(", ")} • {movie.duration_mins && formatDuration(movie.duration_mins)}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}


// Add/Edit Show Modal Component
const ShowModal = ({ isOpen, onClose, onSubmit, editData = null, screens = [] }) => {
  const [formData, setFormData] = useState({
    movie_id: "",
    screen_id: "",
    show_date: "",
    start_time: "",
    end_time: "",
    language_version: "",
    price_override: {
      premium: "",
      gold: "",
      silver: "",
    },
  })

  useEffect(() => {
    if (editData) {
      setFormData({
        movie_id: editData.movie_id || "",
        screen_id: editData.screen_id || "",
        show_date: editData.show_date ? editData.show_date.split("T")[0] : "",
        start_time: editData.start_time || "",
        end_time: editData.end_time || "",
        language_version: editData.language_version || "",
        price_override: {
          premium: editData.price_override?.premium || "",
          gold: editData.price_override?.gold || "",
          silver: editData.price_override?.silver || "",
        },
      })
    } else {
      setFormData({
        movie_id: "",
        screen_id: "",
        show_date: "",
        start_time: "",
        end_time: "",
        language_version: "",
        price_override: {
          premium: "",
          gold: "",
          silver: "",
        },
      })
    }
  }, [editData, isOpen])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handlePriceChange = (tier, value) => {
    setFormData((prev) => ({
      ...prev,
      price_override: {
        ...prev.price_override,
        [tier]: value,
      },
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editData ? "Edit Show" : "Add New Show"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Movie</Label>
            <MovieSearchDropdown
              selectedMovieId={formData.movie_id}
              onMovieSelect={(movieId) => setFormData((prev) => ({ ...prev, movie_id: movieId }))}
              placeholder="Select a movie"
            />
          </div>

          <div className="space-y-2">
            <Label>Screen</Label>
            <Select
              value={formData.screen_id}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, screen_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select screen" />
              </SelectTrigger>
              <SelectContent>
                {screens.map((screen) => (
                  <SelectItem key={screen.id} value={screen.id}>
                    {screen.name} ({screen.total_seats} seats)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Show Date</Label>
            <Input
              type="date"
              value={formData.show_date}
              onChange={(e) => setFormData((prev) => ({ ...prev, show_date: e.target.value }))}
              required
            />
          </div>

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

          <div className="space-y-2">
            <Label>Language Version</Label>
            <Input
              value={formData.language_version}
              onChange={(e) => setFormData((prev) => ({ ...prev, language_version: e.target.value }))}
              placeholder="e.g., Tamil, English"
              required
            />
          </div>

          <div className="space-y-3">
            <Label>Price Override</Label>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Premium</Label>
                <Input
                  type="number"
                  placeholder="₹"
                  value={formData.price_override.premium}
                  onChange={(e) => handlePriceChange("premium", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Gold</Label>
                <Input
                  type="number"
                  placeholder="₹"
                  value={formData.price_override.gold}
                  onChange={(e) => handlePriceChange("gold", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Silver</Label>
                <Input
                  type="number"
                  placeholder="₹"
                  value={formData.price_override.silver}
                  onChange={(e) => handlePriceChange("silver", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {editData ? "Update Show" : "Add Show"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Main Shows Management Component
const ShowsManagement = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [showsData, setShowsData] = useState(null)
  const [screens, setScreens] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingShow, setEditingShow] = useState(null)

  // Generate next 3 dates
  const dates = Array.from({ length: 4 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() + i)
    return {
      value: date.toISOString().split("T")[0],
      label: date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
    }
  })

  // Fetch shows data
  const fetchShows = async (date) => {
    setIsLoading(true)
    try {
      const response = await showsAPI.getShowsByDate(date)
      setShowsData(response)
    } catch (error) {
      console.error("Error fetching shows:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch screens
  const fetchScreens = async () => {
    try {
      const data = await screensAPI.getMyScreens()
      setScreens(data || [])
    } catch (error) {
      console.error("Error fetching screens:", error)
    }
  }

  useEffect(() => {
    fetchShows(selectedDate)
    fetchScreens()
  }, [selectedDate])

  const handleAddShow = async (formData) => {
    try {
      await showsAPI.createShow(formData)
      setIsAddModalOpen(false)
      fetchShows(selectedDate)
    } catch (error) {
      console.error("Error adding show:", error)
    }
  }

  const handleEditShow = async (formData) => {
    try {
      await showsAPI.editShow(editingShow.id, formData)
      setIsEditModalOpen(false)
      setEditingShow(null)
      fetchShows(selectedDate)
    } catch (error) {
      console.error("Error editing show:", error)
    }
  }

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

  const openEditModal = (show) => {
    setEditingShow(show)    
    setIsEditModalOpen(true)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Shows Management</h1>
          <p className="text-muted-foreground">Manage your cinema shows and schedules</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Show
        </Button>
      </div>

      {/* Date Tabs */}
      <Tabs value={selectedDate} onValueChange={setSelectedDate} className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-md">
          {dates.map((date) => (
            <TabsTrigger key={date.value} value={date.value} className="text-sm">
              {date.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {dates.map((date) => (
          <TabsContent key={date.value} value={date.value} className="mt-6">
            {isLoading ? (
              <div className="space-y-6">
                {[...Array(2)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <div className="flex space-x-4">
                        <Skeleton className="h-24 w-16 rounded" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-6 w-1/3" />
                          <Skeleton className="h-4 w-1/4" />
                          <Skeleton className="h-4 w-1/2" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        {[...Array(3)].map((_, j) => (
                          <Skeleton key={j} className="h-10 w-24" />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : showsData?.grouped?.length > 0 ? (
              <div className="space-y-6">
                {showsData.grouped.map((movieGroup) => (
                  <Card key={movieGroup.movie_id} className="overflow-hidden">
                    <CardHeader className="pb-4">
                      <div className="flex space-x-4">
                        <div className="h-24 w-16 bg-secondary rounded overflow-hidden flex-shrink-0">
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
                        <div className="flex-1">
                          <CardTitle className="text-xl mb-2">{movieGroup.title}</CardTitle>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {formatDuration(movieGroup.duration)}
                            </div>
                            <div className="flex gap-1">
                              {movieGroup.genre?.map((g, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {g}
                                </Badge>
                              ))}
                            </div>
                            <div className="flex gap-1">
                              {movieGroup.language?.map((lang, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {lang}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex flex-wrap gap-4">
                          {movieGroup.shows.map((show) => (
                            <div key={show.id} className="group relative">
                              <Button
                                variant="outline"
                                className="h-auto p-3 flex flex-col items-start gap-2 min-w-[120px] rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
                              >
                                {/* 🏷 Screen Info */}
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <MapPin className="h-3 w-3" />
                                  <span className="truncate max-w-[80px]">{show.screen_name}</span>
                                  <Badge variant="outline" className="text-[10px] px-1 py-0.5 rounded">
                                    {show.total_seats} seats
                                  </Badge>
                                </div>

                                {/* 🕐 Time */}
                                <div className="text-sm font-semibold tracking-tight">{formatTime(show.start_time)}</div>

                                {/* 🎞 Language & Price */}
                                <div className="flex justify-between items-center w-full text-xs text-muted-foreground">
                                  <span>{show.language_version}</span>
                                  <span>₹{show.price_override?.silver || "N/A"}</span>
                                </div>
                              </Button>

                              {/* ✏️🗑 Hover Actions */}
                              <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="h-6 w-6 p-0"
                                  onClick={() => openEditModal(show)}
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
                      </div>

                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No shows scheduled</h3>
                <p className="text-muted-foreground mb-4">
                  No shows are scheduled for {date.label}. Add your first show to get started.
                </p>
                <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Show
                </Button>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Add Show Modal */}
      <ShowModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddShow}
        screens={screens}
      />

      {/* Edit Show Modal */}
      <ShowModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setEditingShow(null)
        }}
        onSubmit={handleEditShow}
        editData={editingShow}
        screens={screens}
      />
    </div>
  )
}

export default ShowsManagement
