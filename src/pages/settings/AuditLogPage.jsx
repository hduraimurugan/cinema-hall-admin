import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import {
  ChevronDown, RefreshCw, History, CalendarDays, CalendarIcon,
  SlidersHorizontal, X, ScrollText,
} from "lucide-react"
import { auditService } from "@/services/settings/auditService"
import { teamService } from "@/services/settings/teamService"
import { Pagination } from "@/components/ui/Pagination"
import { toast } from "sonner"
import dayjs from "dayjs"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"

const RESOURCE_TYPE_LABELS = {
  screen: "Screen",
  show: "Showtime",
  offer: "Offer",
  hall: "Hall",
  refund: "Refund",
  org_settings: "Organization Settings",
  hall_settings: "Hall Settings",
  team_member: "Team Member",
  role: "Role",
}

const ACTION_LABELS = {
  "screens.create": "Created screen",
  "screens.update": "Updated screen",
  "screens.delete": "Deleted screen",
  "shows.create": "Created showtime",
  "shows.create.bulk": "Created showtimes (bulk)",
  "shows.update": "Updated showtime",
  "shows.delete": "Deleted showtime",
  "shows.delete.bulk": "Deleted showtimes (bulk)",
  "shows.cancel": "Cancelled showtime",
  "shows.cancel.bulk": "Cancelled showtimes (bulk)",
  "shows.restore": "Restored showtime",
  "shows.restore.bulk": "Restored showtimes (bulk)",
  "shows.booking_status.update": "Changed booking status",
  "shows.booking_status.update.bulk": "Changed booking status (bulk)",
  "offers.create": "Created offer",
  "offers.update": "Updated offer",
  "offers.delete": "Deleted offer",
  "halls.create": "Created hall",
  "halls.update": "Updated hall",
  "halls.delete": "Deleted hall",
  "refunds.settle": "Settled refund",
  "settings.org.update": "Updated organization settings",
  "settings.hall.update": "Updated hall settings",
  "team.member.invite": "Invited team member",
  "team.member.create": "Added team member",
  "team.member.update": "Updated team member",
  "team.member.remove": "Removed team member",
  "team.member.assign_halls": "Assigned halls",
  "team.member.remove_hall": "Removed hall assignment",
  "roles.create": "Created role",
  "roles.update": "Updated role",
  "roles.delete": "Deleted role",
  "roles.clone": "Cloned role",
}

function actionLabel(action) {
  return ACTION_LABELS[action] || action
}

function resourceTypeLabel(type) {
  return RESOURCE_TYPE_LABELS[type] || type
}

function getInitials(name = "") {
  return name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase() || "?"
}

const avatarColors = [
  "bg-violet-500", "bg-sky-500", "bg-rose-500",
  "bg-amber-500", "bg-teal-500", "bg-pink-500",
]

function avatarColor(name = "") {
  const code = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return avatarColors[code % avatarColors.length]
}

export function AuditLogPage() {
  const [logs, setLogs] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [adminId, setAdminId] = useState("all")
  const [resourceType, setResourceType] = useState("all")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [loading, setLoading] = useState(true)
  const [members, setMembers] = useState([])
  const [selectedLog, setSelectedLog] = useState(null)

  const totalPages = Math.max(1, Math.ceil(total / limit))

  const fetchLogs = useCallback((filters) => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filters.adminId && filters.adminId !== "all") params.set("adminId", filters.adminId)
    if (filters.resourceType && filters.resourceType !== "all") params.set("resourceType", filters.resourceType)
    if (filters.from_date) params.set("from_date", filters.from_date)
    if (filters.to_date) params.set("to_date", filters.to_date)
    params.set("page", filters.page)
    params.set("limit", filters.limit)

    auditService.getLogs(params.toString())
      .then(data => {
        setLogs(data.logs || [])
        setTotal(data.total || 0)
      })
      .catch(err => toast.error(err.error || "Failed to load activity log"))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchLogs({ adminId, resourceType, from_date: fromDate, to_date: toDate, page, limit })
  }, [adminId, resourceType, fromDate, toDate, page, limit, fetchLogs])

  useEffect(() => {
    teamService.getMembers("limit=200")
      .then(data => setMembers(data.members || data.data || []))
      .catch(() => {})
  }, [])

  const handleAdminChange = (val) => { setAdminId(val); setPage(1) }
  const handleResourceTypeChange = (val) => { setResourceType(val); setPage(1) }
  const handleFromDateChange = (d) => { setFromDate(d ? dayjs(d).format("YYYY-MM-DD") : ""); setPage(1) }
  const handleToDateChange = (d) => { setToDate(d ? dayjs(d).format("YYYY-MM-DD") : ""); setPage(1) }

  const hasFilters = adminId !== "all" || resourceType !== "all" || fromDate || toDate
  const activeFilterCount = [adminId !== "all" ? adminId : "", resourceType !== "all" ? resourceType : "", fromDate, toDate].filter(Boolean).length
  const [filtersOpen, setFiltersOpen] = useState(false)

  const handleClear = () => { setAdminId("all"); setResourceType("all"); setFromDate(""); setToDate(""); setPage(1) }

  const resourceTypesInUse = Object.keys(RESOURCE_TYPE_LABELS)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <History className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Activity Log</h1>
            <p className="text-sm text-muted-foreground mt-0.5">See what your team has been doing across the organization</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!loading && total > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-primary inline-block" />
              {total} event{total !== 1 ? "s" : ""}
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchLogs({ adminId, resourceType, from_date: fromDate, to_date: toDate, page, limit })}
            className="gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-border/60">
        <div
          className="flex items-center justify-between px-4 py-2.5 cursor-pointer select-none"
          onClick={() => setFiltersOpen(o => !o)}
        >
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold leading-none">
                {activeFilterCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => { e.stopPropagation(); handleClear() }}
                className="h-6 px-2 gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3" /> Clear
              </Button>
            )}
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${filtersOpen ? "rotate-180" : ""}`} />
          </div>
        </div>
        {filtersOpen && (
          <div className="px-4 pb-3 pt-2 border-t border-border/40">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">Team Member</label>
                <Select value={adminId} onValueChange={handleAdminChange}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="All Members" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Members</SelectItem>
                    {members.map(m => (
                      <SelectItem key={m.admin_id} value={m.admin_id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">Resource</label>
                <Select value={resourceType} onValueChange={handleResourceTypeChange}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="All Resources" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Resources</SelectItem>
                    {resourceTypesInUse.map(rt => (
                      <SelectItem key={rt} value={rt}>{resourceTypeLabel(rt)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <CalendarDays className="w-3 h-3" /> From Date
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn("h-8 w-full justify-start text-left text-xs font-normal", !fromDate && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-1.5 h-3 w-3" />
                      {fromDate ? dayjs(fromDate).format("MMM D, YYYY") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={fromDate ? dayjs(fromDate).toDate() : undefined} onSelect={handleFromDateChange} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <CalendarDays className="w-3 h-3" /> To Date
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn("h-8 w-full justify-start text-left text-xs font-normal", !toDate && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-1.5 h-3 w-3" />
                      {toDate ? dayjs(toDate).format("MMM D, YYYY") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={toDate ? dayjs(toDate).toDate() : undefined} onSelect={handleToDateChange} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Table */}
      <Card className="border-border/60">
        <CardHeader className="px-5 py-4 border-b border-border/40">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ScrollText className="w-4 h-4 text-primary" />
            Events
            {!loading && <span className="text-muted-foreground font-normal">({total})</span>}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <Table>
              <TableHeader>
                <TableRow className="border-border/40">
                  <TableHead className="pl-5">Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Hall</TableHead>
                  <TableHead className="pr-5">When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(6)].map((_, i) => (
                  <TableRow key={i} className="border-border/40">
                    <TableCell className="pl-5">
                      <div className="flex items-center gap-2.5">
                        <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                        <div className="space-y-1.5">
                          <Skeleton className="h-3.5 w-28 rounded" />
                          <Skeleton className="h-3 w-20 rounded" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-3.5 w-32 rounded" /></TableCell>
                    <TableCell><Skeleton className="h-3.5 w-28 rounded" /></TableCell>
                    <TableCell><Skeleton className="h-3.5 w-20 rounded" /></TableCell>
                    <TableCell className="pr-5"><Skeleton className="h-3 w-24 rounded" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
              <History className="w-10 h-10 opacity-20" />
              <p className="text-sm">No activity recorded yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border/40">
                  <TableHead className="pl-5">Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Hall</TableHead>
                  <TableHead className="pr-5">When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow
                    key={log.id}
                    className="border-border/40 cursor-pointer hover:bg-muted/40"
                    onClick={() => setSelectedLog(log)}
                  >
                    <TableCell className="pl-5">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full ${avatarColor(log.actor_name || "")} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                          {getInitials(log.actor_name)}
                        </div>
                        <div>
                          <p className="text-sm font-medium leading-tight">{log.actor_name || "Unknown"}</p>
                          {log.actor_role_key && (
                            <p className="text-xs text-muted-foreground capitalize">{log.actor_role_key}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{actionLabel(log.action)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-[10px] font-medium">
                          {resourceTypeLabel(log.resource_type)}
                        </Badge>
                        {log.resource_label && (
                          <span className="text-xs text-muted-foreground truncate max-w-[160px]">{log.resource_label}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{log.hall_name || "—"}</TableCell>
                    <TableCell className="pr-5 text-xs text-muted-foreground">
                      {dayjs(log.created_at).format("DD MMM, h:mm A")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {!loading && total > 0 && (
            <div className="px-5 pb-3">
              <Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={setPage} onLimitChange={(v) => { setLimit(v); setPage(1) }} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details sheet */}
      <Sheet open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Event Details</SheetTitle>
          </SheetHeader>
          {selectedLog && (
            <div className="px-4 pb-6 space-y-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Actor</p>
                <p className="font-medium">{selectedLog.actor_name || "Unknown"} {selectedLog.actor_role_key && `· ${selectedLog.actor_role_key}`}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Action</p>
                <p className="font-medium">{actionLabel(selectedLog.action)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Resource</p>
                <p className="font-medium">{resourceTypeLabel(selectedLog.resource_type)} {selectedLog.resource_label && `— ${selectedLog.resource_label}`}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Hall</p>
                <p className="font-medium">{selectedLog.hall_name || "Organization-wide"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Timestamp</p>
                <p className="font-medium">{dayjs(selectedLog.created_at).format("DD MMM YYYY, h:mm:ss A")}</p>
              </div>
              {selectedLog.ip_address && (
                <div>
                  <p className="text-xs text-muted-foreground">IP Address</p>
                  <p className="font-medium">{selectedLog.ip_address}</p>
                </div>
              )}
              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Metadata</p>
                  <pre className="text-xs bg-muted/50 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
