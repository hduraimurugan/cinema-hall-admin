import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import {
    Tag, Plus, Search, ChevronLeft, ChevronRight,
    SlidersHorizontal, X, Pencil, Trash2, CalendarIcon,
    RefreshCw, AlertCircle, BadgePercent, Ticket
} from "lucide-react"
import { cn } from "@/lib/utils"
import dayjs from "dayjs"
import { toast } from "sonner"
import { offersAPI } from "../services/api"

function debounce(fn, delay) {
    let t
    return (...args) => {
        clearTimeout(t)
        t = setTimeout(() => fn(...args), delay)
    }
}

const scopeConfig = {
    global: { label: "Global", className: "bg-violet-500/15 text-violet-400 border border-violet-500/25" },
    hall: { label: "Hall", className: "bg-sky-500/15 text-sky-400 border border-sky-500/25" },
}

const activeConfig = {
    true: { label: "Active", className: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25" },
    false: { label: "Inactive", className: "bg-zinc-500/15 text-zinc-400 border border-zinc-500/25" },
}

const EMPTY_FORM = {
    code: "",
    title: "",
    description: "",
    discount_type: "percentage",
    discount_value: "",
    max_discount_amount: "",
    min_booking_amount: "",
    is_active: true,
    valid_until: null,
    scope: "global",
    cinema_hall_id: "",
    user_eligibility: "all",
    user_joined_after: null,
}

const OffersManagement = () => {
    const [offers, setOffers] = useState([])
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [halls, setHalls] = useState([])

    // Filters
    const [searchInput, setSearchInput] = useState("")
    const [search, setSearch] = useState("")
    const [scopeFilter, setScopeFilter] = useState("all")
    const [statusFilter, setStatusFilter] = useState("all")

    // Dialog state
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingOffer, setEditingOffer] = useState(null)
    const [form, setForm] = useState(EMPTY_FORM)
    const [saving, setSaving] = useState(false)

    // Delete state
    const [deleteTarget, setDeleteTarget] = useState(null)
    const [deleting, setDeleting] = useState(false)

    const totalPages = Math.max(1, Math.ceil(total / 50))
    const hasFilters = search || scopeFilter !== "all" || statusFilter !== "all"

    const fetchOffers = useCallback((filters) => {
        setLoading(true)
        setError(null)
        offersAPI.getAll(filters)
            .then(data => {
                setOffers(data.offers || [])
                setTotal(data.total || 0)
            })
            .catch(err => setError(err?.error || err?.message || "Failed to load offers"))
            .finally(() => setLoading(false))
    }, [])

    useEffect(() => {
        offersAPI.getCinemaHalls()
            .then(data => setHalls(data.halls || []))
            .catch(() => { })
    }, [])

    useEffect(() => {
        fetchOffers({
            search,
            scope: scopeFilter === "all" ? "" : scopeFilter,
            is_active: statusFilter === "all" ? "" : statusFilter === "active" ? "true" : "false",
            page,
        })
    }, [search, scopeFilter, statusFilter, page, fetchOffers])

    const debouncedSearch = useCallback(
        debounce((val) => { setSearch(val); setPage(1) }, 400),
        []
    )

    const handleSearchChange = (e) => {
        setSearchInput(e.target.value)
        debouncedSearch(e.target.value)
    }

    const clearFilters = () => {
        setSearchInput(""); setSearch("")
        setScopeFilter("all"); setStatusFilter("all")
        setPage(1)
    }

    // ── Form helpers ────────────────────────────────────────────
    const openCreate = () => {
        setEditingOffer(null)
        setForm(EMPTY_FORM)
        setDialogOpen(true)
    }

    const openEdit = (offer) => {
        setEditingOffer(offer)
        setForm({
            code: offer.code,
            title: offer.title,
            description: offer.description || "",
            discount_type: offer.discount_type,
            discount_value: String(offer.discount_value),
            max_discount_amount: offer.max_discount_amount ? String(offer.max_discount_amount) : "",
            min_booking_amount: offer.min_booking_amount ? String(offer.min_booking_amount) : "",
            is_active: offer.is_active,
            valid_until: offer.valid_until ? new Date(offer.valid_until) : null,
            scope: offer.scope,
            cinema_hall_id: offer.cinema_hall_id || "",
            user_eligibility: offer.user_eligibility,
            user_joined_after: offer.user_joined_after ? new Date(offer.user_joined_after) : null,
        })
        setDialogOpen(true)
    }

    const setField = (key, value) => setForm(f => ({ ...f, [key]: value }))

    const handleSave = async () => {
        if (!form.code || !form.title || !form.discount_value || !form.valid_until) {
            toast.error("Code, title, discount value, and valid until are required.")
            return
        }
        if (form.scope === "hall" && !form.cinema_hall_id) {
            toast.error("Please select a cinema hall for hall-scoped offer.")
            return
        }
        if (form.user_eligibility === "joined_after" && !form.user_joined_after) {
            toast.error("Please select the joined-after date.")
            return
        }

        const payload = {
            code: form.code.toUpperCase().trim(),
            title: form.title.trim(),
            description: form.description.trim() || null,
            discount_type: form.discount_type,
            discount_value: parseFloat(form.discount_value),
            max_discount_amount: form.max_discount_amount ? parseFloat(form.max_discount_amount) : null,
            min_booking_amount: form.min_booking_amount ? parseFloat(form.min_booking_amount) : 0,
            is_active: form.is_active,
            valid_until: form.valid_until,
            scope: form.scope,
            cinema_hall_id: form.scope === "hall" ? form.cinema_hall_id : null,
            user_eligibility: form.user_eligibility,
            user_joined_after: form.user_eligibility === "joined_after" ? form.user_joined_after : null,
        }

        try {
            setSaving(true)
            if (editingOffer) {
                await offersAPI.update(editingOffer.id, payload)
                toast.success("Offer updated.")
            } else {
                await offersAPI.create(payload)
                toast.success("Offer created.")
            }
            setDialogOpen(false)
            fetchOffers({ search, scope: scopeFilter === "all" ? "" : scopeFilter, is_active: statusFilter === "all" ? "" : statusFilter === "active" ? "true" : "false", page })
        } catch (err) {
            toast.error(err?.error || "Failed to save offer.")
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!deleteTarget) return
        try {
            setDeleting(true)
            await offersAPI.delete(deleteTarget.id)
            toast.success("Offer deleted.")
            setDeleteTarget(null)
            fetchOffers({ search, scope: scopeFilter === "all" ? "" : scopeFilter, is_active: statusFilter === "all" ? "" : statusFilter === "active" ? "true" : "false", page })
        } catch (err) {
            toast.error(err?.error || "Failed to delete offer.")
        } finally {
            setDeleting(false)
        }
    }

    // ── Discount display helper ─────────────────────────────────
    const formatDiscount = (offer) => {
        if (offer.discount_type === "fixed") return `₹${offer.discount_value} flat`
        const base = `${offer.discount_value}% off`
        return offer.max_discount_amount ? `${base} · max ₹${offer.max_discount_amount}` : base
    }

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-violet-500/10">
                        <Tag className="w-5 h-5 text-violet-500" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold">Offers</h1>
                        <p className="text-sm text-muted-foreground">Create and manage promotional offer codes</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-violet-500/10 text-violet-400 text-xs font-semibold px-3 py-1.5 rounded-full">
                        <Ticket className="w-3.5 h-3.5" />
                        {total} {total === 1 ? "offer" : "offers"}
                    </div>
                    <Button size="sm" onClick={() => fetchOffers({ search, scope: scopeFilter === "all" ? "" : scopeFilter, is_active: statusFilter === "all" ? "" : statusFilter === "active" ? "true" : "false", page })} variant="outline" className="gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5" />
                        Refresh
                    </Button>
                    <Button size="sm" onClick={openCreate} className="gap-1.5">
                        <Plus className="w-4 h-4" />
                        Create Offer
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader className="pb-3 pt-4 px-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
                            Filters
                            {hasFilters && (
                                <span className="bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                                    {[search, scopeFilter !== "all", statusFilter !== "all"].filter(Boolean).length}
                                </span>
                            )}
                        </div>
                        {hasFilters && (
                            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs h-7 gap-1">
                                <X className="w-3 h-3" /> Clear All
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="px-5 pb-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                            <Input
                                placeholder="Search code or title..."
                                value={searchInput}
                                onChange={handleSearchChange}
                                className="pl-9 h-9 text-sm"
                            />
                        </div>
                        <Select value={scopeFilter} onValueChange={v => { setScopeFilter(v); setPage(1) }}>
                            <SelectTrigger className="h-9 text-sm">
                                <SelectValue placeholder="All Scopes" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Scopes</SelectItem>
                                <SelectItem value="global">Global</SelectItem>
                                <SelectItem value="hall">Hall-Specific</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1) }}>
                            <SelectTrigger className="h-9 text-sm">
                                <SelectValue placeholder="All Statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <CardHeader className="pb-2 pt-4 px-5 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">All Offers</CardTitle>
                    {!loading && (
                        <span className="text-xs text-muted-foreground">
                            Showing {offers.length} of {total}
                        </span>
                    )}
                </CardHeader>
                <CardContent className="px-0 pb-0">
                    {loading ? (
                        <div className="space-y-2 px-5 pb-4">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Skeleton key={i} className="h-12 w-full rounded-md" />
                            ))}
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                            <AlertCircle className="w-8 h-8 text-destructive" />
                            <p className="text-sm">{error}</p>
                        </div>
                    ) : offers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                            <Tag className="w-8 h-8" />
                            <p className="text-sm">{hasFilters ? "No offers match your filters." : "No offers yet. Create one!"}</p>
                            {hasFilters && (
                                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs gap-1 mt-1">
                                    <X className="w-3 h-3" /> Clear filters
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="text-xs uppercase tracking-wide text-muted-foreground hover:bg-transparent">
                                        <TableHead className="pl-5">Code</TableHead>
                                        <TableHead>Title</TableHead>
                                        <TableHead>Discount</TableHead>
                                        <TableHead>Scope</TableHead>
                                        <TableHead>Eligibility</TableHead>
                                        <TableHead>Valid Until</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="pr-5 text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {offers.map(offer => (
                                        <TableRow key={offer.id} className="text-sm">
                                            <TableCell className="pl-5">
                                                <span className="font-mono text-xs bg-secondary px-2 py-1 rounded font-semibold tracking-wider">
                                                    {offer.code}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">{offer.title}</div>
                                                {offer.description && (
                                                    <div className="text-xs text-muted-foreground truncate max-w-[180px]">{offer.description}</div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <BadgePercent className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                                                    <span className="text-xs font-medium">{formatDiscount(offer)}</span>
                                                </div>
                                                {offer.min_booking_amount > 0 && (
                                                    <div className="text-xs text-muted-foreground">Min ₹{offer.min_booking_amount}</div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", scopeConfig[offer.scope]?.className)}>
                                                    {scopeConfig[offer.scope]?.label}
                                                </span>
                                                {offer.scope === "hall" && offer.cinema_hall_name && (
                                                    <div className="text-xs text-muted-foreground mt-0.5">{offer.cinema_hall_name}</div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-xs">
                                                    {offer.user_eligibility === "all"
                                                        ? "All users"
                                                        : `Joined after ${dayjs(offer.user_joined_after).format("DD MMM YYYY")}`
                                                    }
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className={cn(
                                                    "text-xs font-medium",
                                                    new Date(offer.valid_until) < new Date() ? "text-red-400" : "text-muted-foreground"
                                                )}>
                                                    {dayjs(offer.valid_until).format("DD MMM YYYY")}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", activeConfig[offer.is_active]?.className)}>
                                                    {activeConfig[offer.is_active]?.label}
                                                </span>
                                            </TableCell>
                                            <TableCell className="pr-5 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(offer)}>
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(offer)}>
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-5 py-3 border-t border-border">
                            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="gap-1">
                                <ChevronLeft className="w-3.5 h-3.5" /> Prev
                            </Button>
                            <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
                            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="gap-1">
                                Next <ChevronRight className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create / Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingOffer ? "Edit Offer" : "Create Offer"}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        {/* Code */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="code">Offer Code <span className="text-destructive">*</span></Label>
                                <Input
                                    id="code"
                                    placeholder="e.g. SAVE50"
                                    value={form.code}
                                    onChange={e => setField("code", e.target.value.toUpperCase())}
                                    className="font-mono uppercase"
                                />
                            </div>
                            <div className="space-y-1.5 flex flex-col justify-end">
                                <div className="flex items-center justify-between">
                                    <Label>Active</Label>
                                    <Switch checked={form.is_active} onCheckedChange={v => setField("is_active", v)} />
                                </div>
                            </div>
                        </div>

                        {/* Title */}
                        <div className="space-y-1.5">
                            <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
                            <Input id="title" placeholder="e.g. New User Discount" value={form.title} onChange={e => setField("title", e.target.value)} />
                        </div>

                        {/* Description */}
                        <div className="space-y-1.5">
                            <Label htmlFor="desc">Description</Label>
                            <Textarea id="desc" placeholder="Short description shown to users..." value={form.description} onChange={e => setField("description", e.target.value)} rows={2} />
                        </div>

                        {/* Discount Type + Value */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label>Discount Type <span className="text-destructive">*</span></Label>
                                <Select value={form.discount_type} onValueChange={v => setField("discount_type", v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                                        <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="disc_val">
                                    {form.discount_type === "percentage" ? "Percentage (%)" : "Amount (₹)"}
                                    <span className="text-destructive"> *</span>
                                </Label>
                                <Input id="disc_val" type="number" min="0" placeholder="e.g. 10" value={form.discount_value} onChange={e => setField("discount_value", e.target.value)} />
                            </div>
                        </div>

                        {/* Max Discount Cap (only for percentage) */}
                        {form.discount_type === "percentage" && (
                            <div className="space-y-1.5">
                                <Label htmlFor="max_cap">Max Discount Cap (₹) <span className="text-xs text-muted-foreground">optional</span></Label>
                                <Input id="max_cap" type="number" min="0" placeholder="e.g. 150 — leave blank for no cap" value={form.max_discount_amount} onChange={e => setField("max_discount_amount", e.target.value)} />
                            </div>
                        )}

                        {/* Min Booking Amount */}
                        <div className="space-y-1.5">
                            <Label htmlFor="min_amt">Minimum Booking Amount (₹) <span className="text-xs text-muted-foreground">optional</span></Label>
                            <Input id="min_amt" type="number" min="0" placeholder="e.g. 300 — leave blank for no minimum" value={form.min_booking_amount} onChange={e => setField("min_booking_amount", e.target.value)} />
                        </div>

                        {/* Valid Until */}
                        <div className="space-y-1.5">
                            <Label>Valid Until <span className="text-destructive">*</span></Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal text-sm h-9", !form.valid_until && "text-muted-foreground")}>
                                        <CalendarIcon className="mr-2 w-4 h-4" />
                                        {form.valid_until ? dayjs(form.valid_until).format("DD MMM YYYY") : "Pick expiry date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar mode="single" selected={form.valid_until} onSelect={d => setField("valid_until", d)} initialFocus />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Scope */}
                        <div className="space-y-1.5">
                            <Label>Scope</Label>
                            <Select value={form.scope} onValueChange={v => setField("scope", v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="global">Global (all halls)</SelectItem>
                                    <SelectItem value="hall">Hall-Specific</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Cinema Hall (only for hall scope) */}
                        {form.scope === "hall" && (
                            <div className="space-y-1.5">
                                <Label>Cinema Hall <span className="text-destructive">*</span></Label>
                                <Select value={form.cinema_hall_id} onValueChange={v => setField("cinema_hall_id", v)}>
                                    <SelectTrigger><SelectValue placeholder="Select a hall..." /></SelectTrigger>
                                    <SelectContent>
                                        {halls.map(h => (
                                            <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* User Eligibility */}
                        <div className="space-y-1.5">
                            <Label>Applicable To</Label>
                            <Select value={form.user_eligibility} onValueChange={v => setField("user_eligibility", v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Users</SelectItem>
                                    <SelectItem value="joined_after">Users who joined after a date</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Joined After Date */}
                        {form.user_eligibility === "joined_after" && (
                            <div className="space-y-1.5">
                                <Label>Joined After <span className="text-destructive">*</span></Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal text-sm h-9", !form.user_joined_after && "text-muted-foreground")}>
                                            <CalendarIcon className="mr-2 w-4 h-4" />
                                            {form.user_joined_after ? dayjs(form.user_joined_after).format("DD MMM YYYY") : "Pick date"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar mode="single" selected={form.user_joined_after} onSelect={d => setField("user_joined_after", d)} initialFocus />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="pt-2">
                        <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? "Saving..." : editingOffer ? "Save Changes" : "Create Offer"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Offer</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete the offer <strong>{deleteTarget?.code}</strong>?
                            This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive hover:bg-destructive/90">
                            {deleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

export default OffersManagement
