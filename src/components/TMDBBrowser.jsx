import { useState, useEffect, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Search, Star, Clock, ChevronLeft, ChevronRight,
  Download, CheckCircle, Flame, Play, CalendarDays, TrendingUp, Globe, Clapperboard
} from "lucide-react"
import { cn } from "@/lib/utils"
import { tmdbAPI } from "../services/api.js"

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w342"

const LANG_OPTIONS = [
  { label: "All Languages", value: "all" },
  { label: "English", value: "en" },
  { label: "Tamil", value: "ta" },
  { label: "Hindi", value: "hi" },
  { label: "Telugu", value: "te" },
  { label: "Malayalam", value: "ml" },
  { label: "Kannada", value: "kn" },
  { label: "Marathi", value: "mr" },
]

const SECTIONS = [
  { key: "popular", label: "Popular", icon: Flame },
  { key: "in_theatres", label: "In Theatres", icon: Clapperboard },
  { key: "now_playing", label: "Now Playing", icon: Play },
  { key: "upcoming", label: "Upcoming", icon: CalendarDays },
  { key: "top_rated", label: "Top Rated", icon: TrendingUp },
  { key: "search", label: "Search", icon: Search },
]

// TMDB genre_ids → our genre names
const TMDB_GENRE_MAP = {
  28: "Action",
  35: "Comedy",
  18: "Drama",
  9648: "Mystery",
  14: "Fantasy",
  10749: "Romance",
  27: "Horror",
  53: "Thriller",
  878: "Sci-Fi",
  12: "Adventure",
  10402: "Musical",
  36: "Period",
}

const TMDBCard = ({ movie, isAdded, onImport, importing }) => {
  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : null
  const genres = (movie.genre_ids || []).map((id) => TMDB_GENRE_MAP[id]).filter(Boolean).slice(0, 2)

  return (
    <Card className="overflow-hidden group p-0 border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-0.5 bg-card">
      <div className="relative overflow-hidden">
        <img
          src={movie.poster_path ? `${TMDB_IMAGE_BASE}${movie.poster_path}` : "/placeholder.svg?height=400&width=300"}
          alt={movie.title}
          className="w-full h-72 object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* TMDB rating */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-full px-2 py-0.5">
          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
          <span className="text-white text-xs font-semibold">{movie.vote_average?.toFixed(1)}</span>
        </div>

        {/* Already Added badge */}
        {isAdded && (
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md uppercase tracking-wide">
            <CheckCircle className="w-3 h-3" /> Added
          </div>
        )}

        {/* Duration / year bottom */}
        <div className="absolute bottom-0 left-0 right-0 px-3 py-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {year && (
            <div className="flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-full px-2 py-0.5">
              <Clock className="w-3 h-3 text-white/80" />
              <span className="text-white text-xs font-semibold">{year}</span>
            </div>
          )}
        </div>
      </div>

      <CardContent className="p-3.5">
        <h3 className="font-semibold text-sm mb-2 line-clamp-1 group-hover:text-primary transition-colors">
          {movie.title}
        </h3>
        <div className="flex flex-wrap gap-1 mb-3">
          {genres.map((g) => (
            <Badge key={g} className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20 font-medium rounded-md h-4">
              {g}
            </Badge>
          ))}
          {(movie.genre_ids || []).filter((id) => TMDB_GENRE_MAP[id]).length > 2 && (
            <Badge className="text-[10px] px-1.5 py-0 bg-muted text-muted-foreground border-border font-medium rounded-md h-4">
              +{(movie.genre_ids || []).filter((id) => TMDB_GENRE_MAP[id]).length - 2}
            </Badge>
          )}
        </div>
        <Button
          size="sm"
          className={cn(
            "w-full h-8 text-xs font-medium transition-all",
            isAdded
              ? "bg-emerald-600/15 text-emerald-600 border border-emerald-600/30 hover:bg-emerald-600/20 cursor-default"
              : "bg-primary hover:bg-primary/90 shadow-sm shadow-primary/20"
          )}
          disabled={isAdded || importing}
          onClick={() => !isAdded && onImport(movie)}
        >
          {isAdded ? (
            <><CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Already Added</>
          ) : importing ? (
            "Loading..."
          ) : (
            <><Download className="w-3.5 h-3.5 mr-1.5" /> Import</>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

const TMDBSkeletonCard = () => (
  <Card className="overflow-hidden p-0 border-border/50">
    <Skeleton className="w-full h-72" />
    <CardContent className="p-3.5 space-y-2.5">
      <Skeleton className="h-4 w-3/4" />
      <div className="flex gap-1.5">
        <Skeleton className="h-4 w-14 rounded-md" />
        <Skeleton className="h-4 w-14 rounded-md" />
      </div>
      <Skeleton className="h-8 w-full rounded-md" />
    </CardContent>
  </Card>
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

export const TMDBBrowser = ({ onImport, existingTmdbIds }) => {
  const [activeSection, setActiveSection] = useState("popular")
  const [selectedLanguage, setSelectedLanguage] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [movies, setMovies] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [importingId, setImportingId] = useState(null)

  // Debounce search query
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 400)
    return () => clearTimeout(t)
  }, [searchQuery])

  const fetchMovies = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let data
      const opts = { page, language: selectedLanguage === "all" ? "" : selectedLanguage }
      if (activeSection === "popular") data = await tmdbAPI.getPopular(opts)
      else if (activeSection === "in_theatres") data = await tmdbAPI.getInTheatres(opts)
      else if (activeSection === "now_playing") data = await tmdbAPI.getNowPlaying(opts)
      else if (activeSection === "upcoming") data = await tmdbAPI.getUpcoming(opts)
      else if (activeSection === "top_rated") data = await tmdbAPI.getTopRated(opts)
      else if (activeSection === "search") {
        if (!debouncedQuery.trim()) { setMovies([]); setTotalPages(1); setLoading(false); return }
        data = await tmdbAPI.search({ query: debouncedQuery, ...opts })
      }
      setMovies(data?.results || [])
      setTotalPages(Math.min(data?.total_pages || 1, 500)) // TMDB caps at 500
    } catch (err) {
      setError(err?.message || "Failed to fetch from TMDB")
    } finally {
      setLoading(false)
    }
  }, [activeSection, page, selectedLanguage, debouncedQuery])

  useEffect(() => { fetchMovies() }, [fetchMovies])

  // Reset page when section/language/query changes
  useEffect(() => { setPage(1) }, [activeSection, selectedLanguage, debouncedQuery])

  const handleImport = async (movie) => {
    setImportingId(movie.id)
    try {
      const details = await tmdbAPI.getMovieDetails(movie.id)
      onImport(movie, details)
    } catch {
      // ignore — onImport caller handles errors
    } finally {
      setImportingId(null)
    }
  }

  const getPaginationRange = () => {
    const delta = 2
    const range = []
    for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) range.push(i)
    return range
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Controls bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Section tabs */}
        <div className="flex gap-1 flex-wrap">
          {/* eslint-disable-next-line no-unused-vars */}
          {SECTIONS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
                activeSection === key
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "bg-card border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Language filter */}
        <div className="ml-auto flex items-center gap-2 shrink-0">
          <Globe className="w-3.5 h-3.5 text-muted-foreground" />
          <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
            <SelectTrigger className="h-8 text-xs w-36">
              <SelectValue placeholder="All Languages" />
            </SelectTrigger>
            <SelectContent>
              {LANG_OPTIONS.map(({ label, value }) => (
                <SelectItem key={value} value={value} className="text-xs">{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Search input — only for search section */}
      {activeSection === "search" && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            className="pl-9 h-9 text-sm"
            placeholder="Search movies on TMDB..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4">
          {Array.from({ length: 12 }).map((_, i) => <TMDBSkeletonCard key={i} />)}
        </div>
      ) : activeSection === "search" && !debouncedQuery.trim() ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
            <Search className="w-7 h-7 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">Type a movie title to search TMDB</p>
        </div>
      ) : movies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-sm text-muted-foreground">No movies found.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4">
            {movies.map((movie) => (
              <TMDBCard
                key={movie.id}
                movie={movie}
                isAdded={existingTmdbIds.has(movie.id)}
                onImport={handleImport}
                importing={importingId === movie.id}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1.5 pb-2 pt-2">
              <Button
                variant="outline" size="icon" className="h-8 w-8"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              {page > 3 && (
                <>
                  <PageBtn page={1} current={page} onClick={setPage} />
                  {page > 4 && <span className="text-muted-foreground text-sm px-1">…</span>}
                </>
              )}

              {getPaginationRange().map((p) => (
                <PageBtn key={p} page={p} current={page} onClick={setPage} />
              ))}

              {page < totalPages - 2 && (
                <>
                  {page < totalPages - 3 && <span className="text-muted-foreground text-sm px-1">…</span>}
                  <PageBtn page={totalPages} current={page} onClick={setPage} />
                </>
              )}

              <Button
                variant="outline" size="icon" className="h-8 w-8"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
