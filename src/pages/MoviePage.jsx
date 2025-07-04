import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Calendar, Clock, Globe, Play, Star } from "lucide-react"
import { moviesAPI } from "../services/api"
import { formatStatus, getStatusColor } from "../utils/utils"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

const MoviePage = () => {
    const { id } = useParams()
    const [movie, setMovie] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const [selectedStatus, setSelectedStatus] = useState(movie?.status)
    const [updatingStatus, setUpdatingStatus] = useState(false)

    useEffect(() => {
        const fetchMovie = async () => {
            try {
                setLoading(true)
                const response = await moviesAPI.getMovieById(id)
                setMovie(response.movie)
                setSelectedStatus(response.movie.status)
            } catch (err) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        if (id) {
            fetchMovie()
        }
    }, [id])

    const getYouTubeEmbedUrl = (url) => {
        const videoId = url.split("v=")[1]?.split("&")[0]
        return `https://www.youtube.com/embed/${videoId}`
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        })
    }

    const handleStatusChange = async () => {
        try {
            setUpdatingStatus(true)
            await moviesAPI.updateStatus(movie.id, selectedStatus)
            setMovie((prev) => ({ ...prev, status: selectedStatus }))
        } catch (err) {
            alert("Failed to update status: " + err.message)
        } finally {
            setUpdatingStatus(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
                <div className="container mx-auto px-4 py-8">
                    <div className="grid lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1">
                            <Skeleton className="w-full h-[600px] rounded-xl" />
                        </div>
                        <div className="lg:col-span-2 space-y-6">
                            <Skeleton className="h-12 w-3/4" />
                            <Skeleton className="h-6 w-full" />
                            <Skeleton className="h-6 w-full" />
                            <Skeleton className="h-6 w-2/3" />
                            <div className="flex gap-2">
                                <Skeleton className="h-6 w-20" />
                                <Skeleton className="h-6 w-20" />
                                <Skeleton className="h-6 w-20" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
                <Card className="p-8 bg-red-50 border-red-200">
                    <CardContent className="text-center">
                        <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Movie</h2>
                        <p className="text-red-500">{error}</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (!movie) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
                <Card className="p-8">
                    <CardContent className="text-center">
                        <h2 className="text-2xl font-bold mb-4">Movie Not Found</h2>
                        <p className="text-gray-600">The requested movie could not be found.</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-black/50 z-10" />
                <div
                    className="absolute inset-0 bg-cover bg-center blur-sm scale-110"
                    style={{ backgroundImage: `url(${movie.poster_url})` }}
                />

                <div className="relative z-20 container mx-auto px-50 py-16">
                    <div className="grid lg:grid-cols-3 gap-8 items-start">
                        {/* Movie Poster */}
                        <div className="lg:col-span-1">
                            <Card className="overflow-hidden shadow-2xl transform hover:scale-105 transition-transform duration-300 p-0 border-0">
                                <img
                                    src={movie.poster_url || "/placeholder.svg"}
                                    alt={movie.title}
                                    className="w-full h-auto object-cover"
                                />
                            </Card>
                        </div>

                        {/* Movie Details */}
                        <div className="lg:col-span-2 text-white space-y-6">
                            <div>
                                <h1 className="md:text-3xl text-xl lg:text-4xl font-bold mb-4 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                                    {movie.title}
                                </h1>
                                <Badge className={`${getStatusColor(movie.status)} text-white uppercase text-sm px-3 py-1`}>
                                    {formatStatus(movie.status)}
                                </Badge>
                            </div>

                            <p className="text-lg lg:text-xl text-gray-200 leading-relaxed">{movie.description}</p>

                            {/* Movie Info Grid */}
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="flex items-center gap-3">
                                    <Clock className="w-5 h-5 text-purple-400" />
                                    <span className="text-lg">{movie.duration_mins} minutes</span>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Calendar className="w-5 h-5 text-purple-400" />
                                    <span className="text-lg">{formatDate(movie.release_date)}</span>
                                </div>
                            </div>

                            {/* Genres */}
                            <div>
                                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                                    <Star className="w-5 h-5 text-yellow-400" />
                                    Genres
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {movie.genre.map((g, index) => (
                                        <Badge
                                            key={index}
                                            variant="secondary"
                                            className="bg-purple-600/20 text-purple-200 border-purple-400/30"
                                        >
                                            {g}
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            {/* Languages */}
                            <div>
                                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                                    <Globe className="w-5 h-5 text-blue-400" />
                                    Languages
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {movie.language.map((lang, index) => (
                                        <Badge key={index} variant="outline" className="border-blue-400/30 text-blue-200">
                                            {lang}
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                <Label className="text-white font-medium">Status:</Label>

                                <div className="flex items-center gap-2">
                                    <Select
                                        value={selectedStatus}
                                        onValueChange={(value) => setSelectedStatus(value)}
                                    >
                                        <SelectTrigger className="w-[160px] bg-slate-800 border-slate-600 text-white">
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-900 border-slate-700 text-white">
                                            <SelectItem value="upcoming">Upcoming</SelectItem>
                                            <SelectItem value="now_showing">Now Showing</SelectItem>
                                            <SelectItem value="ended">Ended</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Button
                                        onClick={handleStatusChange}
                                        disabled={updatingStatus}
                                        className="bg-purple-600 hover:bg-purple-700 transition"
                                    >
                                        {updatingStatus ? "Updating..." : "Update"}
                                    </Button>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>

            {/* Trailer Section */}
            {movie.trailer_url && (
                <div className="container mx-auto px-4 py-16">
                    <Card className="overflow-hidden shadow-2xl">
                        <CardContent className="md:p-8 px-2">
                            <div className="hidden flex items-center gap-3 mb-6">
                                <Play className="w-6 h-6 text-red-500" />
                                <h2 className="text-3xl font-bold">Watch Trailer</h2>
                            </div>

                            <div className="relative aspect-video rounded-xl overflow-hidden shadow-xl">
                                <iframe
                                    src={getYouTubeEmbedUrl(movie.trailer_url)}
                                    title={`${movie.title} Trailer`}
                                    className="w-full h-full"
                                    allowFullScreen
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Additional Info Section */}
            <div className="container mx-auto px-4 pb-16">
                <div className="grid md:grid-cols-2 gap-8">
                    <Card className=" shadow-xl">
                        <CardContent className="p-6">
                            <h3 className="text-2xl font-bold mb-4">Movie Details</h3>
                            <div className="space-y-3 ">
                                <div className="flex justify-between">
                                    <span className="font-medium">Duration:</span>
                                    <span>{movie.duration_mins} minutes</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium">Release Date:</span>
                                    <span>{formatDate(movie.release_date)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium">Status:</span>
                                    <Badge className={`${getStatusColor(movie.status)} uppercase`}>
                                        {formatStatus(movie.status)}
                                    </Badge>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium">Added:</span>
                                    <span>{formatDate(movie.created_at)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className=" shadow-xl">
                        <CardContent className="p-6">
                            <h3 className="text-2xl font-bold mb-4">Synopsis</h3>
                            <p className="leading-relaxed">{movie.description}</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

export default MoviePage
