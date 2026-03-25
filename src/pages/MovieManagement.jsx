import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import {
  ChevronDown, ChevronUp, Plus, Edit, Trash2, Clock, Star, ThumbsUp,
  MoreVertical, Globe, Clapperboard, Swords, Heart, Laugh, Ghost,
  Rocket, Music, Trophy, Sparkles, Users, Zap, SlidersHorizontal,
  Film, ChevronLeft, ChevronRight, X
} from 'lucide-react'
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

const genreIcons = {
  Action: Swords,
  Comedy: Laugh,
  Drama: Ghost,
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

const EditMovieDialog = ({ open, onOpenChange, formData, setFormData, onSubmit, onCancel, uploading, handleImageUpload, editingMovie }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Edit Movie</DialogTitle>
        <DialogDescription>Update the movie information below and save your changes.</DialogDescription>
      </DialogHeader>
      <MovieForm
        formData={formData} setFormData={setFormData} onSubmit={onSubmit}
        onCancel={onCancel} uploading={uploading} handleImageUpload={handleImageUpload}
        editingMovie={editingMovie}
      />
    </DialogContent>
  </Dialog>
)

// ── Filter Panel (shared between sidebar and sheet) ──────────────────────────
const FilterPanel = ({ filters, setFilters, expandedFilters, setExpandedFilters, clearFilters }) => {
  const toggleLanguage = (language) =>
    setFilters((prev) => ({
      ...prev,
      language: prev.language.includes(language)
        ? prev.language.filter((l) => l !== language)
        : [...prev.language, language],
      page: 1,
    }))

  const toggleGenre = (genre) =>
    setFilters((prev) => ({
      ...prev,
      genre: prev.genre.includes(genre)
        ? prev.genre.filter((g) => g !== genre)
        : [...prev.genre, genre],
      page: 1,
    }))

  const activeCount = filters.language.length + filters.genre.length + (filters.release_date ? 1 : 0)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">Filters</span>
          {activeCount > 0 && (
            <span className="bg-primary text-primary-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button
            onClick={clearFilters}
            className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {/* Languages */}
        <FilterSection
          icon={Globe}
          label="Languages"
          expanded={expandedFilters.languages}
          onToggle={() => setExpandedFilters((p) => ({ ...p, languages: !p.languages }))}
          activeCount={filters.language.length}
        >
          <div className="grid grid-cols-2 gap-1.5 pt-2">
            {languages.map((lang) => (
              <FilterChip
                key={lang}
                label={lang}
                active={filters.language.includes(lang)}
                onClick={() => toggleLanguage(lang)}
              />
            ))}
          </div>
        </FilterSection>

        {/* Genres */}
        <FilterSection
          icon={Clapperboard}
          label="Genres"
          expanded={expandedFilters.genres}
          onToggle={() => setExpandedFilters((p) => ({ ...p, genres: !p.genres }))}
          activeCount={filters.genre.length}
        >
          <div className="grid grid-cols-2 gap-1.5 pt-2">
            {genres.map((genre) => {
              const Icon = genreIcons[genre] || Clapperboard
              return (
                <FilterChip
                  key={genre}
                  label={genre}
                  icon={Icon}
                  active={filters.genre.includes(genre)}
                  onClick={() => toggleGenre(genre)}
                />
              )
            })}
          </div>
        </FilterSection>

        {/* Release Date */}
        <FilterSection
          icon={CalendarIcon}
          label="Release Date"
          expanded={expandedFilters.releaseDate}
          onToggle={() => setExpandedFilters((p) => ({ ...p, releaseDate: !p.releaseDate }))}
          activeCount={filters.release_date ? 1 : 0}
        >
          <div className="pt-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-9 text-sm",
                    !filters.release_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-3.5 w-3.5" />
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
            {filters.release_date && (
              <button
                onClick={() => setFilters((p) => ({ ...p, release_date: "", page: 1 }))}
                className="mt-1.5 text-xs text-muted-foreground hover:text-primary transition-colors w-full text-center"
              >
                Clear date
              </button>
            )}
          </div>
        </FilterSection>
      </div>
    </div>
  )
}

function FilterSection({ icon, label, expanded, onToggle, activeCount, children }) {
  const SectionIcon = icon
  return (
    <div className="rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full px-3 py-2.5 rounded-xl hover:bg-muted/60 transition-colors group"
      >
        <div className="flex items-center gap-2">
          <SectionIcon className="w-3.5 h-3.5 text-primary" />
          <span className="text-sm font-medium">{label}</span>
          {activeCount > 0 && (
            <span className="bg-primary/15 text-primary text-[10px] font-semibold rounded-full px-1.5 py-0.5 leading-none">
              {activeCount}
            </span>
          )}
        </div>
        {expanded
          ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
          : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
      </button>
      <div className={cn(
        "overflow-hidden transition-all duration-300 ease-in-out px-1",
        expanded ? "max-h-[500px] opacity-100 pb-3" : "max-h-0 opacity-0"
      )}>
        {children}
      </div>
    </div>
  )
}

function FilterChip({ label, icon, active, onClick }) {
  const ChipIcon = icon
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg border text-xs transition-all duration-200 w-full",
        active
          ? "bg-primary/15 border-primary/50 text-primary font-medium shadow-sm"
          : "bg-card border-border/50 hover:border-primary/30 hover:bg-primary/5 text-muted-foreground hover:text-foreground"
      )}
    >
      {ChipIcon && <ChipIcon className="w-3 h-3 flex-shrink-0" />}
      <span className="truncate">{label}</span>
    </button>
  )
}

// ── Movie Card ────────────────────────────────────────────────────────────────
const MovieCard = ({ movie, onEdit, onDelete, onClick }) => (
  <Card
    className="overflow-hidden group cursor-pointer p-0 border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-0.5 bg-card"
    onClick={onClick}
  >
    <div className="relative overflow-hidden">
      <LazyLoadImage
        src={movie.poster_url || "/placeholder.svg?height=400&width=300"}
        alt={movie.title}
        effect="blur"
        height="100%"
        width="100%"
        className="w-full h-72 object-cover transition-transform duration-500 group-hover:scale-105"
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Status badge */}
      {movie.status && (
        <div className={cn(
          "absolute top-2.5 left-2.5 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shadow-md",
          getStatusColor(movie.status)
        )}>
          {formatStatus(movie.status)}
        </div>
      )}

      {/* Action menu */}
      <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0">
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="secondary"
              className="w-7 h-7 bg-background/90 backdrop-blur-sm border-0 shadow-lg hover:bg-background"
              onClick={(e) => { e.preventDefault(); e.stopPropagation() }}
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[130px]">
            <DropdownMenuItem onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(movie) }}>
              <Edit className="w-3.5 h-3.5 mr-2" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(movie.id) }}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Bottom stats */}
      <div className="absolute bottom-0 left-0 right-0 px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-full px-2 py-0.5">
          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
          <span className="text-white text-xs font-semibold">8.5</span>
        </div>
        <div className="flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-full px-2 py-0.5">
          <ThumbsUp className="w-3 h-3 text-emerald-400" />
          <span className="text-white text-xs font-semibold">2.5K</span>
        </div>
      </div>
    </div>

    <CardContent className="p-3.5">
      <h3 className="font-semibold text-sm mb-2 line-clamp-1 group-hover:text-primary transition-colors">
        {movie.title}
      </h3>
      <div className="flex flex-wrap gap-1 mb-2.5">
        {movie.genre?.slice(0, 2).map((g, i) => (
          <Badge key={i} className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20 font-medium rounded-md h-4">
            {g}
          </Badge>
        ))}
        {movie.genre?.length > 2 && (
          <Badge className="text-[10px] px-1.5 py-0 bg-muted text-muted-foreground border-border font-medium rounded-md h-4">
            +{movie.genre.length - 2}
          </Badge>
        )}
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="truncate max-w-[65%]">{movie.language?.join(", ")}</span>
        <div className="flex items-center gap-2 shrink-0">
          <span className="flex items-center gap-0.5">
            <Clock className="w-3 h-3" />{movie.duration_mins}m
          </span>
          <span className="flex items-center gap-0.5">
            <CalendarIcon className="w-3 h-3" />{new Date(movie.release_date).getFullYear()}
          </span>
        </div>
      </div>
    </CardContent>
  </Card>
)

// ── Skeleton Card ─────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <Card className="overflow-hidden p-0 border-border/50">
    <Skeleton className="w-full h-72" />
    <CardContent className="p-3.5 space-y-2.5">
      <Skeleton className="h-4 w-3/4" />
      <div className="flex gap-1.5">
        <Skeleton className="h-4 w-14 rounded-md" />
        <Skeleton className="h-4 w-14 rounded-md" />
      </div>
      <div className="flex justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
    </CardContent>
  </Card>
)

// ── Main Component ────────────────────────────────────────────────────────────
const MovieManagement = () => {
  const navigate = useNavigate()
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({ genre: [], language: [], release_date: "", page: 1, limit: 12 })
  const [totalPages, setTotalPages] = useState(1)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingMovie, setEditingMovie] = useState(null)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [expandedFilters, setExpandedFilters] = useState({ languages: true, genres: false, releaseDate: false })
  const [formData, setFormData] = useState({
    title: "", description: "", poster_url: "", trailer_url: "",
    duration_mins: "", genre: [], language: [], release_date: "",
  })
  const [uploading, setUploading] = useState(false)

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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchMovies() }, [filters])

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
      title: movie.title || "", description: movie.description || "",
      poster_url: movie.poster_url || "", trailer_url: movie.trailer_url || "",
      duration_mins: movie.duration_mins || "", genre: movie.genre || [],
      language: movie.language || [], release_date: movie.release_date || "",
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

  const resetForm = () =>
    setFormData({ title: "", description: "", poster_url: "", trailer_url: "", duration_mins: "", genre: [], language: [], release_date: "" })

  const clearFilters = () =>
    setFilters({ genre: [], language: [], release_date: "", page: 1, limit: 12 })

  const handleEditModalClose = () => {
    setIsEditModalOpen(false)
    resetForm()
    setEditingMovie(null)
  }

  const activeFilterCount = filters.language.length + filters.genre.length + (filters.release_date ? 1 : 0)
  const filterProps = { filters, setFilters, expandedFilters, setExpandedFilters, clearFilters }

  // Pagination range
  const getPaginationRange = () => {
    const delta = 2
    const range = []
    for (let i = Math.max(1, filters.page - delta); i <= Math.min(totalPages, filters.page + delta); i++) {
      range.push(i)
    }
    return range
  }

  return (
    <div className="flex min-h-full bg-background">
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:flex flex-col w-60 xl:w-64 shrink-0 border-r border-border/50 sticky top-0 h-screen bg-card/30">
        <FilterPanel {...filterProps} />
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Page Header */}
        <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border/50">
          <div className="px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {/* Mobile filter trigger */}
              <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="lg:hidden shrink-0 h-9 w-9 relative">
                    <SlidersHorizontal className="w-4 h-4" />
                    {activeFilterCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                        {activeFilterCount}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-72">
                  <SheetHeader className="sr-only">
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <FilterPanel {...filterProps} />
                </SheetContent>
              </Sheet>

              <div className="flex items-center gap-2 min-w-0">
                <Film className="w-5 h-5 text-primary shrink-0" />
                <h1 className="text-lg sm:text-xl font-bold truncate">Movie Management</h1>
              </div>

              {/* Movie count */}
              {!loading && movies.length > 0 && (
                <span className="hidden sm:inline-flex items-center text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full shrink-0">
                  {movies.length} shown
                </span>
              )}
            </div>

            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-primary hover:bg-primary/90 shadow-md shadow-primary/20 shrink-0 h-9">
                  <Plus className="w-4 h-4 sm:mr-1.5" />
                  <span className="hidden sm:inline">Add Movie</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Movie</DialogTitle>
                  <DialogDescription>Fill in the details below to add a new movie to your collection.</DialogDescription>
                </DialogHeader>
                <MovieForm
                  formData={formData} setFormData={setFormData} onSubmit={handleSubmit}
                  onCancel={() => { setIsAddModalOpen(false); resetForm() }}
                  uploading={uploading} handleImageUpload={handleImageUpload} editingMovie={null}
                />
              </DialogContent>
            </Dialog>
          </div>

          {/* Active filter chips */}
          {activeFilterCount > 0 && (
            <div className="px-4 sm:px-6 pb-3 flex flex-wrap gap-1.5">
              {filters.language.map((lang) => (
                <ActiveChip key={lang} label={lang} onRemove={() =>
                  setFilters((p) => ({ ...p, language: p.language.filter((l) => l !== lang), page: 1 }))
                } />
              ))}
              {filters.genre.map((gen) => (
                <ActiveChip key={gen} label={gen} onRemove={() =>
                  setFilters((p) => ({ ...p, genre: p.genre.filter((g) => g !== gen), page: 1 }))
                } />
              ))}
              {filters.release_date && (
                <ActiveChip label={filters.release_date} onRemove={() =>
                  setFilters((p) => ({ ...p, release_date: "", page: 1 }))
                } />
              )}
              <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-primary transition-colors px-1">
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-4 sm:p-6">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 mb-6">
              {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : movies.length === 0 ? (
            <EmptyState activeFilterCount={activeFilterCount} onClearFilters={clearFilters} onAddMovie={() => setIsAddModalOpen(true)} />
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 mb-6">
                {movies.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onClick={() => navigate(`/movie/${movie.id}`)}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-1.5 pb-2">
                  <Button
                    variant="outline" size="icon"
                    className="h-8 w-8"
                    disabled={filters.page === 1}
                    onClick={() => setFilters((p) => ({ ...p, page: p.page - 1 }))}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>

                  {filters.page > 3 && (
                    <>
                      <PageBtn page={1} current={filters.page} onClick={(p) => setFilters((prev) => ({ ...prev, page: p }))} />
                      {filters.page > 4 && <span className="text-muted-foreground text-sm px-1">…</span>}
                    </>
                  )}

                  {getPaginationRange().map((page) => (
                    <PageBtn key={page} page={page} current={filters.page} onClick={(p) => setFilters((prev) => ({ ...prev, page: p }))} />
                  ))}

                  {filters.page < totalPages - 2 && (
                    <>
                      {filters.page < totalPages - 3 && <span className="text-muted-foreground text-sm px-1">…</span>}
                      <PageBtn page={totalPages} current={filters.page} onClick={(p) => setFilters((prev) => ({ ...prev, page: p }))} />
                    </>
                  )}

                  <Button
                    variant="outline" size="icon"
                    className="h-8 w-8"
                    disabled={filters.page === totalPages}
                    onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <EditMovieDialog
        open={isEditModalOpen}
        onOpenChange={(open) => { if (!open) handleEditModalClose() }}
        formData={formData} setFormData={setFormData}
        onSubmit={handleSubmit} onCancel={handleEditModalClose}
        uploading={uploading} handleImageUpload={handleImageUpload}
        editingMovie={editingMovie}
      />
    </div>
  )
}

const ActiveChip = ({ label, onRemove }) => (
  <span className="inline-flex items-center gap-1 bg-primary/10 text-primary border border-primary/20 text-xs px-2 py-0.5 rounded-full">
    {label}
    <button onClick={onRemove} className="hover:text-primary/70 transition-colors">
      <X className="w-2.5 h-2.5" />
    </button>
  </span>
)

const PageBtn = ({ page, current, onClick }) => (
  <Button
    variant={current === page ? "default" : "outline"}
    size="icon"
    className={cn("h-8 w-8 text-xs", current === page && "bg-primary shadow-md shadow-primary/20")}
    onClick={() => onClick(page)}
  >
    {page}
  </Button>
)

const EmptyState = ({ activeFilterCount, onClearFilters, onAddMovie }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
      <Film className="w-8 h-8 text-primary" />
    </div>
    <h3 className="text-lg font-semibold mb-1">No movies found</h3>
    <p className="text-sm text-muted-foreground mb-5 max-w-xs">
      {activeFilterCount > 0
        ? "No movies match your current filters. Try adjusting or clearing them."
        : "Get started by adding your first movie to the collection."}
    </p>
    <div className="flex gap-2">
      {activeFilterCount > 0 && (
        <Button variant="outline" size="sm" onClick={onClearFilters}>Clear Filters</Button>
      )}
      <Button size="sm" onClick={onAddMovie} className="bg-primary hover:bg-primary/90">
        <Plus className="w-4 h-4 mr-1.5" /> Add Movie
      </Button>
    </div>
  </div>
)

export default MovieManagement
