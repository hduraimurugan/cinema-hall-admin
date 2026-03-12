import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, Play } from "lucide-react"
import { LazyLoadImage } from "react-lazy-load-image-component"
import "react-lazy-load-image-component/src/effects/blur.css"
import { moviesAPI } from "@/services/api"

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

const formatDuration = (minutes) => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h ${mins}m`
}

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
        const response = await moviesAPI.getAllMovies({ search: searchTerm, limit: 10 })
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

  useEffect(() => {
    const fetchSelectedMovie = async () => {
      if (!selectedMovieId) return setIsInitialLoading(false)
      try {
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
    if (searchValue) debouncedSearch(searchValue)
  }, [searchValue, debouncedSearch])

  const handleMovieSelect = (movie) => {
    setSelectedMovie(movie)
    onMovieSelect(movie)
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
        type="button"
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

export default MovieSearchDropdown
