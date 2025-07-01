import { useState, useEffect } from "react"
import { Link, useLocation, Outlet } from "react-router-dom"
import { Film, Search, Bell, User, Settings, LogOut, Sun, Moon, Home } from "lucide-react"
import { Sidebar as SidebarIcon, ChevronRight, ChevronLeft } from "lucide-react"
import { GoSidebarCollapse, GoSidebarExpand  } from "react-icons/go";

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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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

// Mock notifications
const mockNotifications = [
    { id: 1, title: "New booking received", time: "2 min ago", type: "booking" },
    { id: 2, title: "Screen 3 maintenance due", time: "1 hour ago", type: "maintenance" },
    { id: 3, title: "Revenue target achieved", time: "3 hours ago", type: "success" },
]

export function CinemaLayout() {
    const [searchValue, setSearchValue] = useState("")
    const [isSearchFocused, setIsSearchFocused] = useState(false)
    const [isMobileView, setIsMobileView] = useState(window.innerWidth < 1024)
    const location = useLocation()

    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();

    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)


    // Handle responsive views
    useEffect(() => {
        const handleResize = () => {
            setIsMobileView(window.innerWidth < 1024)
        }

        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [])

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

    const handleSearch = (e) => {
        e.preventDefault()
        console.log("Searching for:", searchValue)
    }

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
                                    <AppSidebar user={user} pageTitle={pageTitle} />
                                </ScrollArea>
                            </SheetContent>
                        </Sheet>

                        {/* Desktop sidebar toggle */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                            className="hidden lg:flex hover:bg-primary/10 transition-colors duration-200"
                        >
                            {isSidebarCollapsed ? (
                                <GoSidebarCollapse  className="h-5 w-5" />
                            ) : (
                                <GoSidebarExpand  className="h-5 w-5" />
                            )}
                            <span className="sr-only">Toggle sidebar</span>
                        </Button>

                        <Separator orientation="vertical" className="mr-2 h-4" />

                        {/* Mobile Logo */}
                        <Link to="/" className="flex items-center gap-2 lg:hidden">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md">
                                <Film className="h-4 w-4" />
                            </div>
                            <span className="font-semibold text-lg hidden sm:inline-block">CinemaMax</span>
                        </Link>

                        {/* Desktop Logo */}
                        <div className="hidden lg:flex h-16 items-center">
                            <Link to="/" className="flex items-center gap-2">
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md">
                                    <Film className="h-4 w-4" />
                                </div>
                                <span className="font-semibold text-lg">CinemaMax</span>
                            </Link>
                        </div>

                        {/* Breadcrumbs */}
                        <div className="hidden ml-4">
                            <Breadcrumb>
                                <BreadcrumbList>
                                    <BreadcrumbItem>
                                        <BreadcrumbLink asChild>
                                            <Link to="/" className="flex items-center gap-1 hover:text-primary transition-colors">
                                                <Home className="h-3 w-3" />
                                                <span>Home</span>
                                            </Link>
                                        </BreadcrumbLink>
                                    </BreadcrumbItem>
                                    <BreadcrumbSeparator>
                                        <ChevronRight className="h-3 w-3" />
                                    </BreadcrumbSeparator>
                                    <BreadcrumbItem>
                                        <span className="font-medium text-foreground">{pageTitle}</span>
                                    </BreadcrumbItem>
                                </BreadcrumbList>
                            </Breadcrumb>
                        </div>
                    </div>

                    {/* Center section with search */}
                    <div className="flex flex-1 items-center justify-end lg:justify-center px-2">
                        <form onSubmit={handleSearch} className="relative hidden md:block w-full max-w-sm">
                            <Search
                                className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors ${isSearchFocused ? "text-primary" : "text-muted-foreground"
                                    }`}
                            />
                            <Input
                                type="search"
                                placeholder="Search movies, bookings..."
                                className={`w-full pl-9 bg-secondary/50 border-0 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all duration-200 ${isSearchFocused ? "shadow-md" : ""
                                    }`}
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                                onFocus={() => setIsSearchFocused(true)}
                                onBlur={() => setIsSearchFocused(false)}
                            />
                        </form>
                    </div>

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
                                    <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary animate-pulse">
                                        <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-75"></span>
                                    </span>
                                    <span className="sr-only">Notifications</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-80">
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium">Notifications</p>
                                        <p className="text-xs text-muted-foreground">
                                            You have {mockNotifications.length} unread notifications
                                        </p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <div className="max-h-64 overflow-y-auto">
                                    {mockNotifications.map((notification) => (
                                        <DropdownMenuItem key={notification.id} className="flex flex-col items-start p-3 cursor-pointer">
                                            <div className="flex w-full items-start justify-between">
                                                <p className="text-sm font-medium">{notification.title}</p>
                                                <span className="text-xs text-muted-foreground">{notification.time}</span>
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
                                        <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-semibold">
                                            {user.name.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium">{user.name}</p>
                                        <p className="text-xs text-muted-foreground">{user.email}</p>
                                        <p className="text-xs text-primary font-medium">{user.role}</p>
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
                    className={`hidden h-full border-r bg-background lg:flex lg:flex-shrink-0 transition-all duration-300 ${isSidebarCollapsed ? "w-16" : "w-64"
                        }`}
                >
                    <AppSidebar
                        user={user}
                        pageTitle={pageTitle}
                        collapsed={isSidebarCollapsed} // pass this down
                    />
                </aside>


                {/* Page Content - Scrollable */}
                <main className="flex-1 min-w-0 overflow-hidden">
                    <div className="h-full overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
                        <div className="w-full p-2 md:p-6">
                            <Outlet />
                        </div>
                    </div>
                </main>
            </div>

            {/* Footer */}
            <footer className="hidden border-t bg-background/50 backdrop-blur-sm flex-shrink-0">
                <div className="flex h-7 items-center justify-center px-4">
                    <p className="text-xs text-muted-foreground">© 2025 CinemaMax Admin Panel. All rights reserved.</p>
                </div>
            </footer>
        </div>
    )
}
