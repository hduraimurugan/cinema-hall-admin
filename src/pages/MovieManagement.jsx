import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronDown, ChevronUp, Plus, Edit, Trash2, Upload, Clock, Star, ThumbsUp, MoreVertical, Globe, Clapperboard, Swords, Heart, Laugh, Ghost, Drama, Rocket, Music, Trophy, Sparkles, Users, Zap } from 'lucide-react'
import { CalendarIcon } from 'lucide-react'
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { moviesAPI } from "../services/api.js"
import { uploadImageToCloudinary } from "../services/cloudinary"
import { cn } from "@/lib/utils"
import { formatStatus, genres, getStatusColor, languages } from "../utils/utils.js"
import { useNavigate } from "react-router-dom"
import { MovieForm } from "./MovieForm.jsx"
import { LazyLoadImage } from "react-lazy-load-image-component"
import "react-lazy-load-image-component/src/effects/blur.css"

// Genre icon mapping
const genreIcons = {
  Action: Swords,
  Comedy: Laugh,
  Drama: Drama,
  Horror: Ghost,
  Romance: Heart,
  "Sci-Fi": Rocket,
  Thriller: Zap,
  Animation: Sparkles,
  Adventure: Clapperboard,
  Crime: Users,
  Fantasy: Sparkles,
  Mystery: Ghost,
  Musical: Music,
  War: Trophy,
  Western: Clapperboard,
}

// Language icon
const LanguageIcon = Globe

// Move EditMovieDialog outside of the main component
const EditMovieDialog = ({
  open,
  onOpenChange,
  formData,
  setFormData,
  onSubmit,
  onCancel,
  uploading,
  handleImageUpload,
  editingMovie
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Movie</DialogTitle>
          <DialogDescription>
            Update the movie information below and save your changes.
          </DialogDescription>
        </DialogHeader>
        <MovieForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={onSubmit}
          onCancel={onCancel}
          uploading={uploading}
          handleImageUpload={handleImageUpload}
          editingMovie={editingMovie}
        />
      </DialogContent>
    </Dialog>
  )
}

const MovieManagement = () => {
  const navigate = useNavigate()
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    genre: [],
    language: [],
    release_date: "",
    page: 1,
    limit: 12,
  })
  const [totalPages, setTotalPages] = useState(1)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingMovie, setEditingMovie] = useState(null)
  const [expandedFilters, setExpandedFilters] = useState({
    languages: true,
    genres: false,
    releaseDate: false,
  })

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    poster_url: "",
    trailer_url: "",
    duration_mins: "",
    genre: [],
    language: [],
    release_date: "",
  })
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchMovies()
  }, [filters])

  const fetchMovies = async () => {
    setLoading(true)
    try {
      const response = await moviesAPI.getAllMovies(filters)
      setMovies(response.movies || [])
      setTotalPages(response.totalPages || 1)
    } catch (error) {
      console.error("Error fetching movies:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    setUploading(true)
    try {
      const result = await uploadImageToCloudinary(file)
      setFormData((prev) => ({ ...prev, poster_url: result.url }))
    } catch (error) {
      console.error("Error uploading image:", error)
      alert("Failed to upload image")
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingMovie) {
        await moviesAPI.editMovie(editingMovie.id, formData)
        setIsEditModalOpen(false)
        setEditingMovie(null)
      } else {
        await moviesAPI.addMovie(formData)
        setIsAddModalOpen(false)
      }
      resetForm()
      fetchMovies()
    } catch (error) {
      console.error("Error saving movie:", error)
      alert("Failed to save movie")
    }
  }

  const handleEdit = (movie) => {
    setEditingMovie(movie)
    setFormData({
      title: movie.title || "",
      description: movie.description || "",
      poster_url: movie.poster_url || "",
      trailer_url: movie.trailer_url || "",
      duration_mins: movie.duration_mins || "",
      genre: movie.genre || [],
      language: movie.language || [],
      release_date: movie.release_date || "",
    })
    setIsEditModalOpen(true)
  }

  const handleDelete = async (movieId) => {
    if (window.confirm("Are you sure you want to delete this movie?")) {
      try {
        await moviesAPI.deleteMovie(movieId)
        fetchMovies()
      } catch (error) {
        console.error("Error deleting movie:", error)
        alert("Failed to delete movie")
      }
    }
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      poster_url: "",
      trailer_url: "",
      duration_mins: "",
      genre: [],
      language: [],
      release_date: "",
    })
  }

  const clearFilters = () => {
    setFilters({
      genre: [],
      language: [],
      release_date: "",
      page: 1,
      limit: 12,
    })
  }

  const toggleLanguage = (language) => {
    setFilters((prev) => ({
      ...prev,
      language: prev.language.includes(language)
        ? prev.language.filter((l) => l !== language)
        : [...prev.language, language],
      page: 1,
    }))
  }

  const toggleGenre = (genre) => {
    setFilters((prev) => ({
      ...prev,
      genre: prev.genre.includes(genre)
        ? prev.genre.filter((g) => g !== genre)
        : [...prev.genre, genre],
      page: 1,
    }))
  }

  const handleEditModalClose = () => {
    setIsEditModalOpen(false)
    resetForm()
    setEditingMovie(null)
  }

  return (
    <div className="flex min-h-full">
      {/* Sidebar */}
      <div className="w-61 border-r border-secondary/20 bg-secondary/5 sticky top-0 self-start h-screen overflow-y-auto">
        <div className="p-5 border-b border-secondary/20 bg-background/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Filters</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-xs text-primary hover:bg-primary/10 h-7"
            >
              Clear All
            </Button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Languages Filter */}
          <div className="space-y-3">
            <button
              onClick={() => setExpandedFilters((prev) => ({ ...prev, languages: !prev.languages }))}
              className="flex items-center justify-between w-full text-sm font-medium text-foreground hover:text-primary transition-colors group"
            >
              <div className="flex items-center gap-2">
                <LanguageIcon className="w-4 h-4 text-primary" />
                <span>Languages</span>
              </div>
              {expandedFilters.languages ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground transition-transform duration-300" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform duration-300" />
              )}
            </button>
            <div
              className={cn(
                "grid gap-2 pt-2 overflow-hidden transition-all duration-300 ease-in-out",
                expandedFilters.languages
                  ? "grid-cols-2 max-h-96 opacity-100"
                  : "grid-cols-2 max-h-0 opacity-0"
              )}
            >
              {languages.map((language) => (
                <label
                  key={language}
                  className={cn(
                    "flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border transition-all duration-200 cursor-pointer text-sm",
                    filters.language.includes(language)
                      ? "bg-primary/10 border-primary/40 text-primary font-medium shadow-sm scale-[0.98]"
                      : "bg-background border-secondary/30 hover:border-primary/30 hover:bg-secondary/30 hover:scale-[1.02]"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={filters.language.includes(language)}
                    onChange={() => toggleLanguage(language)}
                    className="sr-only"
                  />
                  <span className="text-xs truncate">{language}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Genres Filter */}
          <div className="space-y-3 pt-2 border-t border-secondary/20">
            <button
              onClick={() => setExpandedFilters((prev) => ({ ...prev, genres: !prev.genres }))}
              className="flex items-center justify-between w-full text-sm font-medium text-foreground hover:text-primary transition-colors group"
            >
              <div className="flex items-center gap-2">
                <Clapperboard className="w-4 h-4 text-primary" />
                <span>Genres</span>
              </div>
              {expandedFilters.genres ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground transition-transform duration-300" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform duration-300" />
              )}
            </button>
            <div
              className={cn(
                "grid gap-2 pt-2 overflow-hidden transition-all duration-300 ease-in-out",
                expandedFilters.genres
                  ? "grid-cols-2 max-h-[500px] opacity-100"
                  : "grid-cols-2 max-h-0 opacity-0"
              )}
            >
              {genres.map((genre) => {
                const GenreIcon = genreIcons[genre] || Clapperboard
                return (
                  <label
                    key={genre}
                    className={cn(
                      "flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg border transition-all duration-200 cursor-pointer text-sm",
                      filters.genre.includes(genre)
                        ? "bg-primary/10 border-primary/40 text-primary font-medium shadow-sm scale-[0.98]"
                        : "bg-background border-secondary/30 hover:border-primary/30 hover:bg-secondary/30 hover:scale-[1.02]"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={filters.genre.includes(genre)}
                      onChange={() => toggleGenre(genre)}
                      className="sr-only"
                    />
                    <GenreIcon className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="text-xs truncate">{genre}</span>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Release Date Filter */}
          <div className="space-y-3 pt-2 border-t border-secondary/20">
            <button
              onClick={() => setExpandedFilters((prev) => ({ ...prev, releaseDate: !prev.releaseDate }))}
              className="flex items-center justify-between w-full text-sm font-medium text-foreground hover:text-primary transition-colors group"
            >
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-primary" />
                <span>Release Date</span>
              </div>
              {expandedFilters.releaseDate ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground transition-transform duration-300" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform duration-300" />
              )}
            </button>
            <div
              className={cn(
                "overflow-hidden transition-all duration-300 ease-in-out",
                expandedFilters.releaseDate
                  ? "max-h-24 opacity-100 pt-2"
                  : "max-h-0 opacity-0 pt-0"
              )}
            >
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-10 text-sm hover:bg-secondary/30 transition-all duration-200",
                      !filters.release_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.release_date ? format(new Date(filters.release_date), "PP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.release_date ? new Date(filters.release_date) : undefined}
                    onSelect={(date) =>
                      setFilters((prev) => ({
                        ...prev,
                        release_date: date ? date.toLocaleDateString("en-CA") : "",
                        page: 1,
                      }))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold">Movie Management</h1>
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Movie
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Movie</DialogTitle>
                  <DialogDescription>
                    Fill in the details below to add a new movie to your collection.
                  </DialogDescription>
                </DialogHeader>
                <MovieForm
                  formData={formData}
                  setFormData={setFormData}
                  onSubmit={handleSubmit}
                  onCancel={() => {
                    setIsAddModalOpen(false);
                    resetForm();
                  }}
                  uploading={uploading}
                  handleImageUpload={handleImageUpload}
                  editingMovie={null}
                />
              </DialogContent>
            </Dialog>
          </div>

          {/* Active Filters */}
          {(filters.genre.length > 0 || filters.language.length > 0 || filters.release_date) && (
            <div className="flex flex-wrap gap-2 mb-6">
              {filters.language.map((lang) => (
                <Badge key={lang} variant="secondary" className="text-primary border-primary bg-primary/10">
                  {lang}
                </Badge>
              ))}
              {filters.genre.map((gen) => (
                <Badge key={gen} variant="secondary" className="text-primary border-primary bg-primary/10">
                  {gen}
                </Badge>
              ))}
              {filters.release_date && (
                <Badge variant="secondary" className="text-primary border-primary bg-primary/10">
                  {filters.release_date}
                </Badge>
              )}
            </div>
          )}

          {/* Movies Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="overflow-hidden animate-pulse p-0">
                  <Skeleton className="w-full h-80" />
                  <CardContent className="p-4 space-y-3">
                    <Skeleton className="h-4 w-3/4" />
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-3 w-16 rounded-full" />
                      <Skeleton className="h-3 w-12 rounded-full" />
                      <Skeleton className="h-3 w-10 rounded-full" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                {movies.map((movie) => (
                  <Card
                    key={movie.id}
                    className="overflow-hidden hover:shadow-lg transition-shadow group p-0 cursor-pointer"
                    onClick={() => navigate(`/movie/${movie.id}`)}
                  >
                    <div className="relative">
                      {/* <img
                        src={movie.poster_url || "/placeholder.svg?height=400&width=300"}
                        alt={movie.title}
                        className="w-full h-80 object-cover"
                      /> */}
                      <LazyLoadImage
                        src={movie.poster_url || "/placeholder.svg?height=400&width=300"}
                        alt={movie.title}
                        effect="blur"
                        height="100%"
                        width="100%"
                        className="w-full h-80 object-cover rounded-xl shadow-md transition-all duration-500 ease-in-out transform hover:scale-105"
                      />


                      {/* Movie Status Badge */}
                      {movie.status && (
                        <div
                          className={`absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-full shadow-md uppercase tracking-wider ${getStatusColor(movie.status)}`}
                        >
                          {formatStatus(movie.status)}
                        </div>
                      )}
                      {/* Action Menu */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="sm"
                              variant="secondary"
                              className="bg-background"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                              }}
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleEdit(movie)
                              }}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleDelete(movie.id)
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      {/* Movie Stats */}
                      <div className="absolute bottom-2 left-2 right-2">
                        <div className="bg-opacity-75 text-white px-2 py-1 rounded text-sm flex items-center justify-between">
                          <div className="flex items-center bg-black/30 rounded-full px-2">
                            <Star className="w-3 h-3 mr-1 text-yellow-400" />
                            <span>8.5</span>
                          </div>
                          <div className="flex items-center bg-black/30 rounded-full px-2">
                            <ThumbsUp className="w-3 h-3 mr-1 text-green-400" />
                            <span>2.5K</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-2 line-clamp-1">{movie.title}</h3>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex flex-wrap gap-1">
                          {movie.genre?.map((g, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="text-xs px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-full"
                            >
                              {g}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center text-xs text-neutral-500">
                          <Clock className="w-3 h-3 mr-1" />
                          {movie.duration_mins}m
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-neutral-600">{movie.language?.join(", ")}</span>
                        <div className="flex items-center text-xs text-neutral-500">
                          <CalendarIcon className="w-3 h-3 mr-1" />
                          {new Date(movie.release_date).getFullYear()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2">
                  <Button
                    variant="outline"
                    disabled={filters.page === 1}
                    onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}
                  >
                    Previous
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={filters.page === page ? "default" : "outline"}
                      onClick={() => setFilters((prev) => ({ ...prev, page }))}
                      className={filters.page === page ? "bg-primary" : ""}
                    >
                      {page}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    disabled={filters.page === totalPages}
                    onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Edit Modal */}
          <EditMovieDialog
            open={isEditModalOpen}
            onOpenChange={(open) => {
              if (!open) {
                handleEditModalClose()
              }
            }}
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmit}
            onCancel={handleEditModalClose}
            uploading={uploading}
            handleImageUpload={handleImageUpload}
            editingMovie={editingMovie}
          />
        </div>
      </div>
    </div>
  )
}

export default MovieManagement