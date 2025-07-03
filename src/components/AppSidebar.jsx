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
  Star,
  LogOut,
} from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuth } from "../context/AuthContext"
import { Button } from "@/components/ui/button"

const navigationItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Screens", url: "/screens", icon: Monitor },
  { title: "Movies", url: "/movies", icon: Film, roles: ["superAdmin"] },
  { title: "Showtimes", url: "/shows", icon: Calendar },
  { title: "Bookings", url: "/bookings", icon: Ticket },
]

const managementItems = [
  { title: "Customers", url: "/customers", icon: Users },
  { title: "Revenue", url: "/revenue", icon: DollarSign },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Reviews", url: "/reviews", icon: Star },
]

const systemItems = [{ title: "Settings", url: "/settings", icon: Settings }]

export function AppSidebar({ pageTitle, collapsed = false }) {
  const location = useLocation()
  const { user, cinemaHall, logout, isSuperAdmin } = useAuth()

  const isActive = (url) => location.pathname === url

  const renderSection = (title, items) => (
    <div className="space-y-2">
      {!collapsed && (
        <h4 className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider px-2">
          {title}
        </h4>
      )}
      <div className="space-y-1">
        {items
          .filter(item => {
            // Show if no role restriction OR user has required role
            return !item.roles || item.roles.includes(user?.role)
          })
          .map(({ title, url, icon: Icon }) => (
            <Link
              key={title}
              to={url}
              className={`flex items-center rounded-lg py-2 text-sm font-medium transition-all duration-200 hover:bg-primary/10 ${collapsed ? "justify-center px-2" : "gap-3 px-3"
                } ${isActive(url)
                  ? "bg-gradient-to-r from-primary/20 to-primary/10 border-r-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <Icon className="size-4" />
              {!collapsed && <span>{title}</span>}
            </Link>
          ))}
      </div>
    </div>
  )

  return (
    <div className="flex h-full w-full flex-col bg-background">
      {/* Header */}
      <div className="md:hidden flex h-16 items-center border-b px-4">
        <Link to="/" className={`flex items-center gap-3 ${collapsed ? "justify-center w-full" : ""}`}>
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md">
            <Film className="size-4" />
          </div>
          {!collapsed && (
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{cinemaHall.name}</span>
              <span className="truncate text-xs text-muted-foreground">{cinemaHall.location}</span>
              {/* <span className="truncate text-xs text-muted-foreground">Admin Panel</span> */}
            </div>
          )}
        </Link>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 px-3 overflow-y-auto">
        <div className="space-y-6 py-4">
          {renderSection("Operations", navigationItems)}
          {renderSection("Management", managementItems)}
          {renderSection("System", systemItems)}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t p-4">
        <div
          className={`flex items-center rounded-lg p-2 hover:bg-muted/50 transition-colors ${collapsed ? "justify-center" : "gap-3"
            }`}
        >
          <Avatar className="h-8 w-8 rounded-full border-2 border-primary/20">
            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-semibold">
              {user?.name?.charAt(0) || "A"}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user?.name || "Admin User"}</span>
                <span className="truncate text-xs text-muted-foreground">{user?.role || "Administrator"}</span>
              </div>

              <Button
                variant="destructive"
                size="sm"
                className=""
                onClick={logout}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
