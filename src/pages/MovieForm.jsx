import { genres, languages } from "../utils/utils"
import { format } from "date-fns"
import { useState } from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Calendar as CalendarIcon, Upload } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"

export const MovieForm = ({
    formData,
    setFormData,
    onSubmit,
    onCancel,
    uploading,
    handleImageUpload,
    editingMovie
}) => {
    const [datePickerOpen, setDatePickerOpen] = useState(false)

    return (
        <form onSubmit={onSubmit} className="space-y-6">
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

            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90">
                    {editingMovie ? "Update Movie" : "Add Movie"}
                </Button>
            </div>
        </form>
    )
}
