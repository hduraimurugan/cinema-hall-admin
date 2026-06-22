import { useState, useEffect, useCallback } from "react"
import { SettingsPageHeader } from "@/components/settings/SettingsPageHeader"
import { SettingsCard } from "@/components/settings/SettingsCard"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pagination } from "@/components/ui/Pagination"
import { Loader } from "@/components/Loader"
import { toast } from "sonner"
import { teamService } from "@/services/settings/teamService"
import { TeamInviteDialog } from "@/components/settings/TeamInviteDialog"
import { AddMemberDialog } from "@/components/settings/AddMemberDialog"
import { MemberDetailDrawer } from "@/components/settings/MemberDetailDrawer"
import { Users, Search, MoreHorizontal, ShieldAlert } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const STATUS_COLORS = {
  active: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  invited: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  suspended: "bg-red-500/10 text-red-500 border-red-500/20",
  removed: "bg-muted text-muted-foreground border-border/50",
}

export function TeamManagementPage() {
  const [members, setMembers] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [total, setTotal] = useState(0)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [selectedMemberId, setSelectedMemberId] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const fetchMembers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page, limit })
      if (search) params.set("search", search)
      const data = await teamService.getMembers(params.toString())
      setMembers(data.members || data.data || [])
      setTotal(data.total || data.meta?.total || 0)
    } catch (err) {
      setError(err?.error || "Failed to load team members")
      toast.error(err?.error || "Failed to load team members")
    } finally {
      setLoading(false)
    }
  }, [page, limit, search])

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  useEffect(() => {
    teamService.getRoles()
      .then((data) => setRoles(data.roles || []))
      .catch(() => {})
  }, [])

  const handleSearchChange = (e) => {
    setSearch(e.target.value)
    setPage(1)
  }

  const openMemberDetail = (id) => {
    setSelectedMemberId(id)
    setDrawerOpen(true)
  }

  const totalPages = Math.ceil(total / limit)

  const getRoleName = (member) => {
    return member.role_label || member.role_key || roles.find((r) => r.id === member.role_id)?.label || '—'
  }

  return (
    <div className="space-y-6">
      <SettingsPageHeader
        icon={Users}
        title="Team Management"
        description="Manage team members and their access to cinema resources"
        scope="org"
      />

      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search members..."
            value={search}
            onChange={handleSearchChange}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <TeamInviteDialog
            open={inviteOpen}
            onOpenChange={setInviteOpen}
            onSuccess={fetchMembers}
            roles={roles}
          />
          <AddMemberDialog
            open={addOpen}
            onOpenChange={setAddOpen}
            onSuccess={fetchMembers}
            roles={roles}
          />
        </div>
      </div>

      <SettingsCard>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ShieldAlert className="h-10 w-10 text-destructive mb-3" />
            <p className="text-sm text-destructive font-medium">{error}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={fetchMembers}>
              Try again
            </Button>
          </div>
        ) : members.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground font-medium">No team members yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Invite members or add them manually to get started.
            </p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Halls</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow
                    key={member.id}
                    className="cursor-pointer"
                    onClick={() => openMemberDetail(member.id)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 rounded-full">
                          {member.avatar && <AvatarImage src={member.avatar} alt={member.name} />}
                          <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                            {member.name?.charAt(0)?.toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{member.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{member.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-medium">
                        {getRoleName(member)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-medium ${STATUS_COLORS[member.status] || STATUS_COLORS.active}`}
                      >
                        {member.status || "active"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {member.hall_count ?? member.halls?.length ?? 0}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openMemberDetail(member.id)}>
                            View Details
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="px-6 pb-4">
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  total={total}
                  limit={limit}
                  onPageChange={setPage}
                  onLimitChange={setLimit}
                />
              </div>
            )}
          </>
        )}
      </SettingsCard>

      <MemberDetailDrawer
        memberId={selectedMemberId}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onSuccess={fetchMembers}
        roles={roles}
      />
    </div>
  )
}
