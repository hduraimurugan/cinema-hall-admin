import {
  Film,
  Home,
  Users,
  BarChart3,
  Settings,
  Calendar,
  Ticket,
  Monitor,
  DollarSign,
  LogOut,
  ScanLine,
  CreditCard,
  Megaphone,
  Tag,
  Building2,
  RefreshCw,
} from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useAuth } from "../context/AuthContext"
import { Button } from "@/components/ui/button"
import { formatRole } from "../utils/utils"

const navigationItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Screens", url: "/screens", icon: Monitor },
  { title: "Movies", url: "/movies", icon: Film },
  { title: "Ads", url: "/ads", icon: Megaphone, roles: ["superAdmin"] },
  { title: "Offers", url: "/offers", icon: Tag, roles: ["superAdmin"] },
  { title: "Showtimes", url: "/shows", icon: Calendar },
  { title: "Bookings", url: "/bookings", icon: Ticket },
  { title: "Refunds", url: "/refunds", icon: RefreshCw },
  { title: "Payment Orders", url: "/payment-orders", icon: CreditCard },
  { title: "Verify Ticket", url: "/verify-ticket", icon: ScanLine },
]

const managementItems = [
  { title: "Customers", url: "/customers", icon: Users, roles: ["superAdmin"] },
  { title: "Hall Admins", url: "/admins", icon: Building2, roles: ["superAdmin"] },
  { title: "Revenue", url: "/revenue", icon: DollarSign },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
]

const systemItems = [{ title: "Settings", url: "/settings", icon: Settings }]

export function AppSidebar({ collapsed = false }) {
  const location = useLocation()
  const { user, cinemaHall, logout } = useAuth()

  const isActive = (url) => location.pathname === url

  const NavItem = ({ title, url, icon }) => {
    const Icon = icon
    const active = isActive(url)

    const linkContent = (
      <Link
        to={url}
        className={`group flex items-center overflow-hidden rounded-md text-sm font-medium transition-all duration-200 ${
          collapsed ? "justify-center p-2" : "gap-3 px-3 py-2"
        } ${
          active
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
        }`}
      >
        <span
          className={`flex items-center justify-center rounded p-1 transition-colors duration-200 ${
            active
              ? "bg-primary/15 text-primary"
              : "text-muted-foreground group-hover:bg-muted group-hover:text-foreground"
          }`}
        >
          <Icon className="size-4" />
        </span>
        {!collapsed && (
          <span className={`truncate ${active ? "font-semibold" : ""}`}>{title}</span>
        )}
        {!collapsed && active && (
          <span className="ml-auto h-2 w-2 rounded-full bg-primary" />
        )}
      </Link>
    )

    if (collapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent side="right" className="text-xs font-medium">
            {title}
          </TooltipContent>
        </Tooltip>
      )
    }

    return linkContent
  }

  const renderSection = (title, items) => {
    const filteredItems = items.filter(
      (item) => !item.roles || item.roles.includes(user?.role)
    )
    if (filteredItems.length === 0) return null

    return (
      <div className="space-y-1">
        {!collapsed ? (
          <div className="flex items-center gap-2 px-2 mb-2">
            <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest whitespace-nowrap">
              {title}
            </span>
            <div className="flex-1 h-px bg-border/50" />
          </div>
        ) : (
          <div className="flex justify-center py-1">
            <div className="h-px w-5 bg-border/50" />
          </div>
        )}
        <div className="space-y-0.5">
          {filteredItems.map((item) => (
            <NavItem key={item.title} {...item} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-full w-full flex-col bg-background">
        {/* Mobile Header */}
        <div className="lg:hidden flex h-16 items-center border-b px-4">
          <Link
            to="/"
            className={`flex items-center gap-3 ${collapsed ? "justify-center w-full" : ""}`}
          >
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md">
              <Film className="size-4" />
            </div>
            {!collapsed && (
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{cinemaHall.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {cinemaHall.location}
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* Nav Content */}
        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="space-y-4 px-2 py-4">
            {renderSection("Operations", navigationItems)}
            {renderSection("Management", managementItems)}
            {renderSection("System", systemItems)}
          </div>
        </ScrollArea>

        {/* Footer */}
        <Separator />
        <div className="p-3">
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={logout}
                  className="flex w-full items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <LogOut className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs font-medium">
                Sign out
              </TooltipContent>
            </Tooltip>
          ) : (
            <div className="flex items-center gap-3 rounded-lg bg-muted/40 px-3 py-2.5">
              <Avatar className="h-8 w-8 shrink-0 rounded-full border-2 border-primary/20">
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-xs font-bold">
                  {user?.name?.charAt(0)?.toUpperCase() || "A"}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
                <span className="truncate font-semibold text-foreground">
                  {user?.name || "Admin User"}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {formatRole(user?.role) || "Administrator"}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={logout}
                title="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}
