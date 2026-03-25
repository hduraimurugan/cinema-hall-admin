import { genres, languages } from "../utils/utils"
import { format } from "date-fns"
import { useState } from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Calendar as CalendarIcon, Upload, Plus, X, User, RefreshCw } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"

export const MovieForm = ({
    formData,
    setFormData,
    onSubmit,
    onCancel,
    uploading,
    handleImageUpload,
    editingMovie,
    onSyncFromTMDB,
    syncing = false,
}) => {
    const [datePickerOpen, setDatePickerOpen] = useState(false)
    const [newCast, setNewCast] = useState({ name: "", character: "", profile_path: "" })
    const [showCastForm, setShowCastForm] = useState(false)

    return (
        <>
            <form onSubmit={onSubmit} className="space-y-6">
                {/* Sync from TMDB banner — Edit mode only, when tmdb_id exists */}
                {editingMovie && formData.tmdb_id && onSyncFromTMDB && (
                    <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5">
                        <div className="flex items-center gap-2">
                            <RefreshCw className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span className="text-xs text-muted-foreground">
                                Linked to TMDB <span className="font-medium text-foreground">#{formData.tmdb_id}</span> — fill empty fields from TMDB
                            </span>
                        </div>
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1.5 border-primary/30 hover:bg-primary/10 shrink-0"
                            onClick={onSyncFromTMDB}
                            disabled={syncing}
                        >
                            <RefreshCw className={`w-3 h-3 ${syncing ? "animate-spin" : ""}`} />
                            {syncing ? "Syncing…" : "Sync from TMDB"}
                        </Button>
                    </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Title *</Label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) =>
                                setFormData((prev) => ({ ...prev, title: e.target.value }))
                            }
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="duration">Duration (minutes) *</Label>
                        <Input
                            id="duration"
                            type="number"
                            value={formData.duration_mins}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    duration_mins: e.target.value
                                }))
                            }
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) =>
                            setFormData((prev) => ({
                                ...prev,
                                description: e.target.value
                            }))
                        }
                        rows={3}
                        required
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Genre *</Label>
                        <div className="flex flex-wrap gap-2">
                            {genres.map((genre) => (
                                <Badge
                                    key={genre}
                                    variant={
                                        formData.genre.includes(genre) ? "default" : "outline"
                                    }
                                    className="cursor-pointer"
                                    onClick={() =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            genre: prev.genre.includes(genre)
                                                ? prev.genre.filter((g) => g !== genre)
                                                : [...prev.genre, genre]
                                        }))
                                    }
                                >
                                    {genre}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Language *</Label>
                        <div className="flex flex-wrap gap-2">
                            {languages.map((lang) => (
                                <Badge
                                    key={lang}
                                    variant={
                                        formData.language.includes(lang) ? "default" : "outline"
                                    }
                                    className="cursor-pointer"
                                    onClick={() =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            language: prev.language.includes(lang)
                                                ? prev.language.filter((l) => l !== lang)
                                                : [...prev.language, lang]
                                        }))
                                    }
                                >
                                    {lang}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-2 mb-4">
                    <Label htmlFor="release_date" className="text-sm font-medium ">
                        Release Date <span className="text-red-500">*</span>
                    </Label>

                    <div className="relative">
                        <Input
                            id="release_date"
                            type="date"
                            value={formData.release_date ? formData.release_date.slice(0, 10) : ""}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    release_date: e.target.value,
                                }))
                            }
                            required
                            className="appearance-none py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background "
                        />
                        {/* <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none" /> */}
                    </div>
                </div>



                {/* <div className="space-y-2 mb-4">
                <Label>Release Date *</Label>
                <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className={`w-full justify-start text-left font-normal ${formData.release_date ? "" : "text-muted-foreground"
                                }`}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.release_date
                                ? format(new Date(formData.release_date), "PPP")
                                : "Pick a date"}
                        </Button>
                    </PopoverTrigger>

                    <PopoverContent className="w-auto p-0 z-50">
                        <Calendar
                            mode="single"
                            selected={
                                formData.release_date
                                    ? new Date(formData.release_date)
                                    : undefined
                            }
                            onSelect={(date) => {
                                if (date) {
                                    console.log("Selected Date:", date)
                                    setFormData((prev) => ({
                                        ...prev,
                                        release_date: date, // store Date object, format when submitting
                                    }))
                                    setDatePickerOpen(false)
                                }
                            }}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
            </div> */}


                <div className="space-y-2">
                    <Label htmlFor="trailer_url">Trailer URL</Label>
                    <Input
                        id="trailer_url"
                        type="url"
                        value={formData.trailer_url}
                        onChange={(e) =>
                            setFormData((prev) => ({
                                ...prev,
                                trailer_url: e.target.value
                            }))
                        }
                        placeholder="https://youtube.com/watch?v=..."
                    />
                </div>

                <div className="space-y-2">
                    <Label>Poster Image *</Label>
                    <div className="flex items-center gap-4">
                        <Input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={uploading}
                        />
                        <Button type="button" disabled={uploading} variant="outline">
                            <Upload className="w-4 h-4 mr-2" />
                            {uploading ? "Uploading..." : "Upload"}
                        </Button>
                    </div>

                    {formData.poster_url && (
                        <div
                            className={`mt-2 ${datePickerOpen ? "pointer-events-none" : ""
                                }`}
                        >
                            <img
                                src={formData.poster_url || "/placeholder.svg"}
                                alt="Preview"
                                className="w-32 h-48 object-cover rounded"
                            />
                        </div>
                    )}
                </div>

                {/* Vote Average & Vote Count */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="vote_average">TMDB Rating</Label>
                        <Input
                            id="vote_average"
                            type="number"
                            min="0"
                            max="10"
                            step="0.1"
                            value={formData.vote_average ?? ""}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    vote_average: e.target.value === "" ? null : parseFloat(e.target.value),
                                }))
                            }
                            placeholder="0.0 – 10.0"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="vote_count">Vote Count</Label>
                        <Input
                            id="vote_count"
                            type="number"
                            min="0"
                            value={formData.vote_count ?? ""}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    vote_count: e.target.value === "" ? null : parseInt(e.target.value, 10),
                                }))
                            }
                            placeholder="e.g. 1200"
                        />
                    </div>
                </div>

                {/* Cast */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Label>Cast</Label>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs gap-1"
                            onClick={() => setShowCastForm((v) => !v)}
                        >
                            <Plus className="w-3 h-3" /> Add Member
                        </Button>
                    </div>

                    {/* Inline add-cast form */}
                    {showCastForm && (
                        <div className="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                                <Input
                                    placeholder="Name *"
                                    value={newCast.name}
                                    onChange={(e) => setNewCast((p) => ({ ...p, name: e.target.value }))}
                                    className="h-8 text-sm"
                                />
                                <Input
                                    placeholder="Character"
                                    value={newCast.character}
                                    onChange={(e) => setNewCast((p) => ({ ...p, character: e.target.value }))}
                                    className="h-8 text-sm"
                                />
                            </div>
                            <Input
                                placeholder="Profile image URL (optional)"
                                value={newCast.profile_path}
                                onChange={(e) => setNewCast((p) => ({ ...p, profile_path: e.target.value }))}
                                className="h-8 text-sm"
                            />
                            <div className="flex justify-end gap-2">
                                <Button
                                    type="button" variant="ghost" size="sm" className="h-7 text-xs"
                                    onClick={() => { setShowCastForm(false); setNewCast({ name: "", character: "", profile_path: "" }) }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button" size="sm" className="h-7 text-xs bg-primary hover:bg-primary/90"
                                    disabled={!newCast.name.trim()}
                                    onClick={() => {
                                        setFormData((prev) => ({ ...prev, cast: [...(prev.cast || []), { name: newCast.name.trim(), character: newCast.character.trim(), profile_path: newCast.profile_path.trim() || null }] }))
                                        setNewCast({ name: "", character: "", profile_path: "" })
                                        setShowCastForm(false)
                                    }}
                                >
                                    Add
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Cast list */}
                    {formData.cast?.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {formData.cast.map((member, i) => {
                                const imgSrc = member.profile_path
                                    ? member.profile_path.startsWith("http")
                                        ? member.profile_path
                                        : `https://image.tmdb.org/t/p/w92${member.profile_path}`
                                    : null
                                return (
                                    <div key={i} className="flex items-center gap-2.5 rounded-lg border border-border/50 bg-card px-3 py-2 group">
                                        {imgSrc ? (
                                            <img src={imgSrc} alt={member.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                                                <User className="w-4 h-4 text-muted-foreground" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium truncate">{member.name}</p>
                                            {member.character && <p className="text-[10px] text-muted-foreground truncate">{member.character}</p>}
                                        </div>
                                        <button
                                            type="button"
                                            className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                                            onClick={() => setFormData((prev) => ({ ...prev, cast: prev.cast.filter((_, idx) => idx !== i) }))}
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <p className="text-xs text-muted-foreground">No cast members added. Import from TMDB or add manually.</p>
                    )}
                </div>

                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button type="submit" className="bg-primary hover:bg-primary/90">
                        {editingMovie ? "Update Movie" : "Add Movie"}
                    </Button>
                </div>
            </form>
        </>
    )
}
