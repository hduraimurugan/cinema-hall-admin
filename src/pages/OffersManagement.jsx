import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import {
    Tag, Plus, Search, ChevronLeft, ChevronRight,
    SlidersHorizontal, X, Pencil, Trash2,
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

const OffersManagement = () => {
    const navigate = useNavigate()
    const [offers, setOffers] = useState([])
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Filters
    const [searchInput, setSearchInput] = useState("")
    const [search, setSearch] = useState("")
    const [scopeFilter, setScopeFilter] = useState("all")
    const [statusFilter, setStatusFilter] = useState("all")

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

    const handleDelete = async () => {
        if (!deleteTarget) return
        try {
            setDeleting(true)
            await offersAPI.delete(deleteTarget.id)
            toast.success("Offer deleted.")
            setDeleteTarget(null)
            fetchOffers({
                search,
                scope: scopeFilter === "all" ? "" : scopeFilter,
                is_active: statusFilter === "all" ? "" : statusFilter === "active" ? "true" : "false",
                page,
            })
        } catch (err) {
            toast.error(err?.error || "Failed to delete offer.")
        } finally {
            setDeleting(false)
        }
    }

    const formatDiscount = (offer) => {
        if (offer.discount_type === "fixed") return `₹${offer.discount_value} flat`
        const base = `${offer.discount_value}% off`
        return offer.max_discount_amount ? `${base} · max ₹${offer.max_discount_amount}` : base
    }

    const currentFilters = {
        search,
        scope: scopeFilter === "all" ? "" : scopeFilter,
        is_active: statusFilter === "all" ? "" : statusFilter === "active" ? "true" : "false",
        page,
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
                    <Button size="sm" onClick={() => fetchOffers(currentFilters)} variant="outline" className="gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5" />
                        Refresh
                    </Button>
                    <Button size="sm" onClick={() => navigate("/offers/new")} className="gap-1.5">
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
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border bg-muted/40">
                                        <th className="pl-5 py-3"><Skeleton className="h-3 w-10 rounded" /></th>
                                        <th className="py-3"><Skeleton className="h-3 w-16 rounded" /></th>
                                        <th className="py-3"><Skeleton className="h-3 w-16 rounded" /></th>
                                        <th className="py-3"><Skeleton className="h-3 w-12 rounded" /></th>
                                        <th className="py-3"><Skeleton className="h-3 w-20 rounded" /></th>
                                        <th className="py-3"><Skeleton className="h-3 w-16 rounded" /></th>
                                        <th className="py-3"><Skeleton className="h-3 w-12 rounded" /></th>
                                        <th className="pr-5 py-3"><Skeleton className="h-3 w-14 rounded ml-auto" /></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <tr key={i}>
                                            <td className="pl-5 py-3.5"><Skeleton className="h-6 w-16 rounded" /></td>
                                            <td className="py-3.5 pr-4">
                                                <Skeleton className="h-4 w-32 rounded mb-1.5" />
                                                <Skeleton className="h-3 w-20 rounded" />
                                            </td>
                                            <td className="py-3.5 pr-4">
                                                <Skeleton className="h-4 w-24 rounded mb-1.5" />
                                                <Skeleton className="h-3 w-14 rounded" />
                                            </td>
                                            <td className="py-3.5 pr-4"><Skeleton className="h-5 w-14 rounded-full" /></td>
                                            <td className="py-3.5 pr-4"><Skeleton className="h-4 w-24 rounded" /></td>
                                            <td className="py-3.5 pr-4"><Skeleton className="h-4 w-20 rounded" /></td>
                                            <td className="py-3.5 pr-4"><Skeleton className="h-5 w-14 rounded-full" /></td>
                                            <td className="pr-5 py-3.5">
                                                <div className="flex justify-end gap-1.5">
                                                    <Skeleton className="h-7 w-7 rounded" />
                                                    <Skeleton className="h-7 w-7 rounded" />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                            <AlertCircle className="w-8 h-8 text-destructive" />
                            <p className="text-sm">{error}</p>
                            <Button variant="outline" size="sm" onClick={() => fetchOffers(currentFilters)} className="gap-1.5">
                                <RefreshCw className="w-3.5 h-3.5" />
                                Try Again
                            </Button>
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
                                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(`/offers/${offer.id}/edit`)}>
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
