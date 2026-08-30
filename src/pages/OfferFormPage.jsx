import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { ArrowLeft, CalendarIcon, Tag } from "lucide-react"
import { cn } from "@/lib/utils"
import dayjs from "dayjs"
import { toast } from "sonner"
import { offersAPI } from "../services/api"
import { useAuth } from "../context/AuthContext"
import NotifyBlock, { EMPTY_NOTIFY, notifyPayload } from "@/components/notifications/NotifyBlock"

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

const OfferFormPage = () => {
    const navigate = useNavigate()
    const { id } = useParams()
    const isEdit = Boolean(id)
    const { isSuperAdmin } = useAuth()

    const [form, setForm] = useState(() => (
        isSuperAdmin ? EMPTY_FORM : { ...EMPTY_FORM, scope: "hall" }
    ))
    const [halls, setHalls] = useState([])
    const [saving, setSaving] = useState(false)
    const [loadingOffer, setLoadingOffer] = useState(isEdit)
    const [notify, setNotify] = useState(EMPTY_NOTIFY)

    const [validUntilPickerOpen, setValidUntilPickerOpen] = useState(false)
    const [joinedAfterPickerOpen, setJoinedAfterPickerOpen] = useState(false)

    useEffect(() => {
        offersAPI.getCinemaHalls()
            .then(data => setHalls(data.halls || []))
            .catch(() => { })
    }, [])

    useEffect(() => {
        if (!isEdit) return
        offersAPI.getById(id)
            .then(data => {
                const offer = data.offer || data
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
            })
            .catch(err => {
                toast.error(err?.error || "Failed to load offer.")
                navigate("/offers")
            })
            .finally(() => setLoadingOffer(false))
    }, [id, isEdit, navigate])

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
            if (isEdit) {
                await offersAPI.update(id, payload)
                toast.success("Offer updated.")
            } else {
                const data = await offersAPI.create({ ...payload, notify: notifyPayload(notify) })
                toast.success(data.announced ? "Offer created and customers notified." : "Offer created.")
            }
            navigate("/offers")
        } catch (err) {
            toast.error(err?.error || "Failed to save offer.")
        } finally {
            setSaving(false)
        }
    }

    if (loadingOffer) {
        return (
            <div className="px-6 py-6 space-y-6">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-md" />
                    <div className="space-y-1.5">
                        <Skeleton className="h-5 w-36" />
                        <Skeleton className="h-3.5 w-52" />
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardContent className="pt-6 space-y-4">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="space-y-1.5">
                                    <Skeleton className="h-3.5 w-24" />
                                    <Skeleton className="h-9 w-full" />
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6 space-y-4">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="space-y-1.5">
                                    <Skeleton className="h-3.5 w-24" />
                                    <Skeleton className="h-9 w-full" />
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    return (
        <div className="px-6 py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => navigate("/offers")}>
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-violet-500/10">
                        <Tag className="w-5 h-5 text-violet-500" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold">{isEdit ? "Edit Offer" : "Create Offer"}</h1>
                        <p className="text-sm text-muted-foreground">
                            {isEdit ? "Update the offer details below." : "Fill in the details to create a new offer code."}
                        </p>
                    </div>
                </div>
            </div>

            {/* Form */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* Left: Offer Details */}
                <Card>
                    <CardHeader className="pb-2 pt-5 px-6">
                        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Offer Details</CardTitle>
                    </CardHeader>
                    <CardContent className="px-6 pb-6 space-y-4">
                        {/* Code + Active */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="code">Offer Code <span className="text-destructive">*</span></Label>
                                <Input
                                    id="code"
                                    placeholder="e.g. SAVE50"
                                    value={form.code}
                                    onChange={e => setField("code", e.target.value.toUpperCase())}
                                    className="font-mono uppercase"
                                    disabled={isEdit}
                                />
                                {isEdit && <p className="text-xs text-muted-foreground">Offer code cannot be changed.</p>}
                            </div>
                            <div className="space-y-1.5 flex flex-col justify-end">
                                <div className="flex items-center justify-between pb-1">
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

                        {/* Max Discount Cap */}
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
                    </CardContent>
                </Card>

                {/* Right: Schedule & Targeting */}
                <Card>
                    <CardHeader className="pb-2 pt-5 px-6">
                        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Schedule & Targeting</CardTitle>
                    </CardHeader>
                    <CardContent className="px-6 pb-6 space-y-4">
                        {/* Valid Until */}
                        <div className="space-y-1.5">
                            <Label>Valid Until <span className="text-destructive">*</span></Label>
                            <Popover open={validUntilPickerOpen} onOpenChange={setValidUntilPickerOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal text-sm h-9", !form.valid_until && "text-muted-foreground")}>
                                        <CalendarIcon className="mr-2 w-4 h-4" />
                                        {form.valid_until ? dayjs(form.valid_until).format("DD MMM YYYY") : "Pick expiry date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar mode="single" selected={form.valid_until} onSelect={d => { setField("valid_until", d); setValidUntilPickerOpen(false) }} initialFocus />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Scope */}
                        <div className="space-y-1.5">
                            <Label>Scope</Label>
                            <Select value={form.scope} onValueChange={v => setField("scope", v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {isSuperAdmin && <SelectItem value="global">Global (all halls)</SelectItem>}
                                    <SelectItem value="hall">Hall-Specific</SelectItem>
                                </SelectContent>
                            </Select>
                            {!isSuperAdmin && (
                                <p className="text-xs text-muted-foreground">Only Super Admin can create offers valid across all halls.</p>
                            )}
                        </div>

                        {/* Cinema Hall */}
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
                                <Popover open={joinedAfterPickerOpen} onOpenChange={setJoinedAfterPickerOpen}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal text-sm h-9", !form.user_joined_after && "text-muted-foreground")}>
                                            <CalendarIcon className="mr-2 w-4 h-4" />
                                            {form.user_joined_after ? dayjs(form.user_joined_after).format("DD MMM YYYY") : "Pick date"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar mode="single" selected={form.user_joined_after} onSelect={d => { setField("user_joined_after", d); setJoinedAfterPickerOpen(false) }} initialFocus />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Announce (create only — re-announce an existing offer from the Offers list) */}
            {!isEdit && (
                <Card>
                    <CardHeader className="pb-2 pt-5 px-6">
                        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Announce</CardTitle>
                    </CardHeader>
                    <CardContent className="px-6 pb-6">
                        <NotifyBlock
                            value={notify}
                            onChange={setNotify}
                            audienceLabel={form.scope === "hall"
                                ? `Customers who booked at ${halls.find(h => h.id === form.cinema_hall_id)?.name || "this hall"}`
                                : "All customers"}
                            titlePlaceholder={form.title || "Auto-generated from the offer details"}
                        />
                    </CardContent>
                </Card>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => navigate("/offers")} disabled={saving} className="min-w-[100px]">Cancel</Button>
                <Button onClick={handleSave} disabled={saving} className="min-w-[100px]">
                    {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Offer"}
                </Button>
            </div>
        </div>
    )
}

export default OfferFormPage
