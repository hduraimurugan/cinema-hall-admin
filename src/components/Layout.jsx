import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useTheme } from '../context/ThemeContext';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { ScrollArea } from "@/components/ui/scroll-area"
import { FaPersonMilitaryRifle } from "react-icons/fa6";

// Import icons
import {
  Search,
  Menu,
  Bell,
  User,
  Settings,
  LogOut,
  Sun,
  Moon,
  Home,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Notifications from '../pages/Notifications';

export const Layout = () => {
  const { user, logout } = useAuth();
  const [pageTitle, setPageTitle] = useState('Dashboard');
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 1024);
  const [searchValue, setSearchValue] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  // Handle responsive views
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Set page title based on current route
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('dashboard')) setPageTitle('Dashboard');
    else if (path.includes('profile')) setPageTitle('User Profile');
    else if (path.includes('settings')) setPageTitle('System Settings');
    else if (path.includes('analytics')) setPageTitle('Analytics Dashboard');
    else if (path.includes('users')) setPageTitle('User Management');
    else setPageTitle('Admin Panel');
  }, [location.pathname]);

  const handleSearch = (e) => {
    e.preventDefault();
    console.log('Searching for:', searchValue);
  };

  return (
      <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex-shrink-0">
        <div className="w-full flex h-16 items-center px-4 justify-between sm:space-x-0">
          <div className="flex items-center gap-2">
            {/* Mobile menu trigger */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="px-3 w-[280px]">
                <ScrollArea className="h-full">
                  <Sidebar pageTitle={pageTitle} />
                </ScrollArea>
              </SheetContent>
            </Sheet>

            {/* App logo/title for mobile */}
            <Link to="/" className="flex items-center gap-2 lg:hidden">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
                <FaPersonMilitaryRifle className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-lg hidden sm:inline-block">
                 Admin Management
              </span>
            </Link>

            {/* App logo/title for Web */}
            <div className="hidden lg:flex h-16 items-center">
              <Link to="/" className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary">
                  <FaPersonMilitaryRifle className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-semibold text-lg">
                  Admin Management
                </span>
              </Link>
            </div>

          </div>

          {/* Center section with search */}
          <div className="hidden flex flex-1 items-center justify-end lg:justify-center px-2">
            <form onSubmit={handleSearch} className="relative hidden md:block w-full max-w-sm">
              <Search className={`absolute left-2.5 top-2.5 h-4 w-4 ${isSearchFocused ? 'text-primary' : 'text-muted-foreground'}`} />
              <Input
                type="search"
                placeholder="Search..."
                className={`w-full pl-8 rounded-full ${isSearchFocused ? 'ring-1 ring-ring' : ''}`}
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
              className="ml-2 rounded-full hover:bg-muted transition-all"
            >
              {theme === "dark" ? (
                <Sun size={18} className="text-slate-50 transition-transform hover:rotate-45" />
              ) : (
                <Moon size={18} className="text-slate-700 transition-transform hover:-rotate-45" />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary"></span>
                  <span className="sr-only">Notifications</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="md:w-77 w-88">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">Notifications</p>
                    {/* <p className="text-xs text-muted-foreground">You have 3 unread messages</p> */}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Notifications />
                <DropdownMenuSeparator />
                <Link to="/notifications" className="block w-full">
                  <Button variant="ghost" className="w-full justify-center">View All</Button>
                </Link>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                      {user?.name?.charAt(0) || 'A'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
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
                <DropdownMenuItem className="flex cursor-pointer items-center gap-2 text-destructive focus:text-destructive "
                  onClick={logout}>
                  <LogOut className="h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Breadcrumbs */}
      <div className="hidden border-b bg-muted/40 flex-shrink-0">
        <div className="w-full flex h-10 items-center px-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/" className="flex items-center gap-1">
                    <Home className="h-3 w-3" />
                    <span>Home</span>
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator>
                <ChevronRight className="h-3 w-3" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <span className="font-medium">{pageTitle}</span>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      {/* Main Content Area - Flex container with sidebar and scrollable main */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar - Hidden on mobile */}
        <aside className="hidden h-full border-r bg-background lg:block lg:w-64 lg:flex-shrink-0">
          {/* <ScrollArea className="h-full"> */}
          <Sidebar pageTitle={pageTitle} />
          {/* </ScrollArea> */}
        </aside>

        {/* Page Content - Scrollable */}
        <main className="flex-1 min-w-0 overflow-hidden">
          <div className="h-full overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
            <div className="w-full p-2 md:p-6">
              <Outlet />
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="hidden border-t py-3 px-4 flex-shrink-0">
        <div className="w-full flex items-center justify-center text-xs text-muted-foreground">
          <p>Copyright © 2025 - All rights reserved by Durai UI Admin</p>
        </div>
      </footer>
    </div>
  );
};