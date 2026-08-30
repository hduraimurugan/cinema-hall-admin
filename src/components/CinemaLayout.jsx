import { useState, useEffect, useCallback } from "react"
import { Link, useLocation, Outlet } from "react-router-dom"
import { Film, Search, Bell, User, Settings, LogOut, Sun, Moon, Home } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { Sidebar as SidebarIcon, ChevronRight, ChevronLeft } from "lucide-react"
import { GoSidebarCollapse, GoSidebarExpand } from "react-icons/go";

import { AppSidebar } from "./AppSidebar"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useTheme } from "../context/ThemeContext"
import { useAuth } from "../context/AuthContext"
import { useHall } from "../context/HallContext"
import { HallSwitcher } from "./HallSwitcher"
import { formatRole, getDisplayRole, getRoleBadgeClass } from "../utils/utils";
import SearchMovies from "./SearchMovies";
import { notificationAPI } from "../services/api";

const NOTIFICATION_POLL_MS = 25000

export function CinemaLayout() {
    
    const location = useLocation()

    const { user, cinemaHall, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { hallKey } = useHall();

    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
        const storedState = localStorage.getItem("sidebar-collapsed")
        return storedState !== null ? JSON.parse(storedState) : false
    })

    useEffect(() => {
        localStorage.setItem("sidebar-collapsed", JSON.stringify(isSidebarCollapsed))
    }, [isSidebarCollapsed])

    const [notifications, setNotifications] = useState([])
    const [unreadCount, setUnreadCount] = useState(0)

    const refreshNotifications = useCallback(async () => {
        try {
            const [{ notifications: list }, { count }] = await Promise.all([
                notificationAPI.list(1, 5),
                notificationAPI.getUnreadCount(),
            ])
            setNotifications(list)
            setUnreadCount(count)
        } catch {
            // Non-fatal — the bell just doesn't update this cycle.
        }
    }, [])

    useEffect(() => {
        if (!user) {
            setNotifications([])
            setUnreadCount(0)
            return
        }

        refreshNotifications()

        const interval = setInterval(() => {
            if (document.visibilityState === "visible") refreshNotifications()
        }, NOTIFICATION_POLL_MS)
        return () => clearInterval(interval)
    }, [user, refreshNotifications])

    const handleNotificationClick = async (notification) => {
        if (!notification.read_at) {
            setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read_at: new Date().toISOString() } : n))
            setUnreadCount(prev => Math.max(0, prev - 1))
            try {
                await notificationAPI.markAsRead(notification.id)
            } catch {
                // Non-fatal — next poll will resync.
            }
        }
    }

    // Get page title from pathname
    const getPageTitle = (path) => {
        const segments = path.split("/").filter(Boolean)
        if (segments.length === 0) return "Dashboard"

        const pageMap = {
            dashboard: "Dashboard",
            movies: "Movies Management",
            showtimes: "Showtimes",
            bookings: "Bookings",
            screens: "Screen Management",
            customers: "Customer Management",
            revenue: "Revenue Analytics",
            analytics: "Analytics Dashboard",
            reviews: "Customer Reviews",
            settings: "System Settings",
        }

        return pageMap[segments[0]] || segments[0].charAt(0).toUpperCase() + segments[0].slice(1)
    }

    const pageTitle = getPageTitle(location.pathname)


    return (
        <div className="h-screen flex flex-col bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 flex-shrink-0">
                <div className="w-full flex h-16 items-center px-4 justify-between">
                    <div className="flex items-center gap-2">
                        {/* Mobile menu trigger */}
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="lg:hidden hover:bg-primary/10 transition-colors duration-200"
                                >
                                    <SidebarIcon className="h-5 w-5" />
                                    <span className="sr-only">Toggle sidebar</span>
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="px-3 w-[280px]">
                                <ScrollArea className="h-full">
                                    <div className="px-2 pt-4 pb-2">
                                        <HallSwitcher />
                                    </div>
                                    <AppSidebar user={user} pageTitle={pageTitle} />
                                </ScrollArea>
                            </SheetContent>
                        </Sheet>

                        {/* Desktop sidebar toggle */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsSidebarCollapsed(prev => !prev)}
                            className="hidden lg:flex hover:bg-primary/10 transition-colors duration-200"
                        >
                            {isSidebarCollapsed ? (
                                <GoSidebarCollapse className="h-5 w-5" />
                            ) : (
                                <GoSidebarExpand className="h-5 w-5" />
                            )}
                            <span className="sr-only">Toggle sidebar</span>
                        </Button>

                        <Separator orientation="vertical" className="mr-2 h-4" />

                        {/* Mobile Logo */}
                        <Link to="/" className="flex items-center gap-2 lg:hidden">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md">
                                <Film className="h-4 w-4" />
                            </div>
                            <span className="font-semibold text-base hidden sm:inline-block">CineMax Admin</span>
                        </Link>

                        {/* Desktop Logo */}
                        <Link to="/" className="hidden lg:flex items-center gap-2.5 mr-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md">
                                <Film className="h-4 w-4" />
                            </div>
                            <div className="flex flex-col gap-0 justify-center items-start leading-tight">
                                <span className="font-bold text-sm tracking-tight">CineMax Admin</span>
                                <span className="text-[10px] text-muted-foreground font-medium tracking-wide uppercase">Management</span>
                            </div>
                        </Link>

                        {/* Hall Switcher — desktop, next to logo */}
                        <div className="hidden lg:flex items-center">
                            <Separator orientation="vertical" className="h-6 mx-3" />
                            <HallSwitcher />
                        </div>
                    </div>

                    {/* Center section with search */}
                    <>
                       <SearchMovies />
                    </>

                    {/* Right side actions */}
                    <div className="flex items-center justify-end gap-2">
                        {/* Theme Toggle */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleTheme}
                            className="rounded-full hover:bg-primary/10 transition-all duration-200"
                        >
                            {theme === "dark" ? (
                                <Sun className="h-5 w-5 transition-transform hover:rotate-45" />
                            ) : (
                                <Moon className="h-5 w-5 transition-transform hover:-rotate-45" />
                            )}
                            <span className="sr-only">Toggle theme</span>
                        </Button>

                        {/* Notifications */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="relative rounded-full hover:bg-primary/10 transition-all duration-200"
                                >
                                    <Bell className="h-5 w-5" />
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary animate-pulse">
                                            <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-75"></span>
                                        </span>
                                    )}
                                    <span className="sr-only">Notifications</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-80">
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium">Notifications</p>
                                        <p className="text-xs text-muted-foreground">
                                            {unreadCount > 0 ? `You have ${unreadCount} unread notifications` : "You're all caught up"}
                                        </p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <div className="max-h-64 overflow-y-auto">
                                    {notifications.length === 0 && (
                                        <p className="px-3 py-6 text-center text-sm text-muted-foreground">No notifications yet</p>
                                    )}
                                    {notifications.map((notification) => (
                                        <DropdownMenuItem
                                            key={notification.id}
                                            className="flex flex-col items-start p-3 cursor-pointer"
                                            onClick={() => handleNotificationClick(notification)}
                                        >
                                            <div className="flex w-full items-start justify-between gap-2">
                                                <p className={`text-sm ${!notification.read_at ? "font-medium" : "text-muted-foreground"}`}>{notification.title}</p>
                                                <span className="text-xs text-muted-foreground shrink-0">
                                                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                                </span>
                                            </div>
                                        </DropdownMenuItem>
                                    ))}
                                </div>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link to="/notifications" className="w-full text-center">
                                        View all notifications
                                    </Link>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* User Menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="relative h-9 w-9 rounded-full hover:bg-primary/10 transition-all duration-200"
                                >
                                    <Avatar className="h-9 w-9 border-2 border-primary/20">
                                        {user?.avatar && <AvatarImage src={user.avatar} alt={user?.name} className="object-cover" />}
                                        <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-semibold">
                                            {user?.name?.charAt(0) ?? "?"}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium">{user.name}</p>
                                        <p className="text-xs text-muted-foreground">{user.email}</p>
                                        <span
                                            className={`inline-flex w-fit items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${getRoleBadgeClass(getDisplayRole(user))}`}
                                        >
                                            {formatRole(getDisplayRole(user))}
                                        </span>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link to="/profile" className="flex cursor-pointer items-center gap-2">
                                        <User className="h-4 w-4" />
                                        Profile
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link to="/settings" className="flex cursor-pointer items-center gap-2">
                                        <Settings className="h-4 w-4" />
                                        Settings
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="flex cursor-pointer items-center gap-2 text-destructive focus:text-destructive"
                                    onClick={logout}
                                >
                                    <LogOut className="h-4 w-4" />
                                    Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex flex-1 min-h-0">
                {/* Sidebar - Hidden on mobile */}
                <aside
                    className={`hidden h-full border-r bg-background lg:flex lg:flex-shrink-0 transition-all duration-300 ${isSidebarCollapsed ? "w-16" : "w-56"
                        }`}
                >
                    <AppSidebar
                        user={user}
                        pageTitle={pageTitle}
                        collapsed={isSidebarCollapsed} // pass this down
                    />
                </aside>


                {/* Page Content - Scrollable */}
                <main key={hallKey} className="flex-1 min-w-0 overflow-hidden">
                    <div
                        className="h-full overflow-y-auto"
                        style={{ scrollbarWidth: location.pathname === "/movies" ? "none" : "auto" }}
                    >
                        <div className="w-full">
                            <Outlet />
                        </div>
                    </div>
                </main>
            </div>

            {/* Footer */}
            <footer className="hidden border-t bg-background/50 backdrop-blur-sm flex-shrink-0">
                <div className="flex h-7 items-center justify-center px-4">
                    <p className="text-xs text-muted-foreground">© 2025 {cinemaHall?.name ?? "CineMax"} Admin Panel. All rights reserved.</p>
                </div>
            </footer>
        </div>
    )
}
