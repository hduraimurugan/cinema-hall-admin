import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Import icons
import {
  LayoutDashboard,
  BarChart3,
  Users,
  User,
  Settings,
  Shield,
  LogOut,
  ArrowRightLeft,
  FileText,
  Inbox,
  MessageSquare,
  Calendar,
  HelpCircle,
  ChevronRight
} from 'lucide-react';
import { FaPersonMilitaryRifle, FaUsers } from 'react-icons/fa6'

export const Sidebar = ({ pageTitle }) => {
  const { user, logout, role } = useAuth();
  const location = useLocation();

  // Check if the current path matches the link path
  const isActive = (path) => location.pathname === path;

  // Navigation menu items
  const mainNavigation = [
    {
      name: 'Dashboard',
      path: '/',
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      name: 'Hall Management',
      path: '/halls',
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      name: 'Shows management',
      path: '/shows',
      icon: <BarChart3 className="h-5 w-5" />,
    },
    {
      name: 'Bookings',
      path: '/bookings',
      icon: <FileText className="h-5 w-5" />
    }
  ];

  const communicationItems = [
    {
      name: 'Messages',
      path: '/messages',
      icon: <MessageSquare className="h-5 w-5" />,
      badge: 'New',
      badgeVariant: 'default'
    },
    {
      name: 'Inbox',
      path: '/inbox',
      icon: <Inbox className="h-5 w-5" />,
      badge: '3',
      badgeVariant: 'outline'
    },
    {
      name: 'Calendar',
      path: '/calendar',
      icon: <Calendar className="h-5 w-5" />,
    }
  ];

  const accountItems = [
    {
      name: 'Profile',
      path: '/profile',
      icon: <User className="h-5 w-5" />,
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: <Settings className="h-5 w-5" />,
    }
  ];

  // NavItem component for consistent styling of each navigation item
  const NavItem = ({ item }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          to={item.path}
          className={`
            flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors
            ${isActive(item.path)
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'hover:bg-muted text-muted-foreground hover:text-foreground'
            }
          `}
        >
          <div className="flex items-center gap-3">
            {item.icon}
            <span>{item.name}</span>
          </div>
          {item.badge && (
            <Badge variant={item.badgeVariant || 'secondary'} className="ml-auto">
              {item.badge}
            </Badge>
          )}
          {isActive(item.path) && (
            <ChevronRight className="ml-auto h-4 w-4" />
          )}
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right" align="center" className="z-50">
        {item.name}
      </TooltipContent>
    </Tooltip>
  );

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-screen w-64 flex-col bg-background border-r shadow-sm relative">

        {/* Header */}
        {/* App logo/title for mobile */}
        <div className="lg:hidden px-3 py-5 border-b">
          <Link to="/" className="flex items-center gap-2 ">
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-primary">
              <FaPersonMilitaryRifle className="h-3 w-3 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sm sm:inline-block">
              Military Assets Management
            </span>
          </Link>
        </div>

        <div className="px-4 py-3 border-b">
          <div className="flex items-center justify-between rounded-lg bg-card px-3 py-2 shadow-sm">
            <h1 className="text-sm text-center font-semibold truncate">{pageTitle}</h1>
          </div>
        </div>

        {/* Scrollable Section */}
        <ScrollArea className="flex-1 px-3 pt-3 pb-3 overflow-y-auto">

          {/* Main Navigation */}
          <div>
            <h3 className="text-xs font-medium uppercase text-muted-foreground mb-1 px-1">Main Navigation</h3>
            <div className="space-y-1">
              {mainNavigation.map(i => (
                <NavItem key={i.path} item={i} />
              ))}
            </div>
          </div>

          {/* Account */}
          <div className="mt-4">
            <h3 className="text-xs font-medium uppercase text-muted-foreground mb-1 px-1">Account</h3>
            <div className="space-y-1">
              {accountItems.map(i => (
                <NavItem key={i.path} item={i} />
              ))}
            </div>
          </div>


          {/* Help Section */}
          <div className="mt-6 px-1 mb-20">
            <div className="rounded-lg border bg-card p-3 space-y-2 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                  <HelpCircle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="text-sm font-medium">Need help?</h4>
                  <p className="text-xs text-muted-foreground">Check our docs</p>
                </div>
              </div>
              <a
                href="https://github.com/hduraimurugan/military-management-FE/blob/main/README.md"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm" className="w-full">
                  View Documentation
                </Button>
              </a>
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t px-4 py-5 bg-background shadow-inner sticky bottom-0">
          <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-3 mb-3 border">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-semibold">
                {user?.name?.charAt(0) || 'A'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{user?.name || 'Admin User'}</p>
              {/* <Badge variant="outline" className={`text-xs ${getRoleColor(role)}`}>
                {getRoleLabel(role)}
              </Badge> */}
            </div>
          </div>
          <Button
            onClick={logout}
            size="sm"
            className="w-full justify-start bg-red-500 text-white hover:bg-red-600"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
};