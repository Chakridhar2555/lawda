'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BellIcon, Search, X, Heart, Building, Menu as MenuIcon } from "lucide-react";
import { UserProfile } from '@/components/user-profile';
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { dataService, type SearchResult } from '@/lib/data-service';
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/theme-toggle";
import { ThemeProvider } from "@/components/theme-provider";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Mail,
  Package,
  Settings,
  LogOut,
} from "lucide-react";
import { NotificationsPopover } from "@/components/notifications-popover"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ProfileSettings } from '@/components/profile-settings';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: "Dashboard", href: "/user/dashboard", icon: LayoutDashboard, permission: "dashboard" },
  { name: "Leads", href: "/user/leads", icon: Users, permission: "leads" },
  { name: "Calendar", href: "/user/calendar", icon: Calendar, permission: "calendar" },
  { name: "Email", href: "/user/email", icon: Mail, permission: "email" },
  { name: "Inventory", href: "/user/inventory", icon: Package, permission: "inventory" },
  { name: "Settings", href: "/user/settings", icon: Settings, permission: "settings" },
  { name: "Favorites", href: "/user/favorites", icon: Heart, permission: "favorites" },
  { name: "MLS", href: "/user/mls", icon: Building, permission: "mls" },
];

export default function UserLayout({ children }: UserLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userPermissions, setUserPermissions] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setUserPermissions(parsedUser.permissions);
    } else {
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const results: SearchResult[] = dataService.search(query);
    setSearchResults(results);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
  };

  const handleResultClick = (result: SearchResult) => {
    router.push(result.link);
    clearSearch();
  };

  const handleUpdateAvatar = async (avatarUrl: string) => {
    try {
      const response = await fetch(`/api/users/${user._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ avatar: avatarUrl }),
      });

      if (!response.ok) {
        throw new Error('Failed to update avatar');
      }

      // Update local storage with new avatar
      const updatedUser = { ...user, avatar: avatarUrl };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('Error updating avatar:', error);
      throw error;
    }
  };

  const handleLogout = () => {
    // Only remove auth-related items
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    document.cookie = 'user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    router.push('/');
  };

  const SidebarContent = () => (
            <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-800 px-6 ring-1 ring-white/5">
              <div className="flex h-16 shrink-0 items-center">
                <Link href="/user/dashboard" className="flex items-center">
                  <span className="text-2xl font-bold text-red-500">GetHome</span>
                  <span className="ml-2 text-xl font-semibold text-gray-200">Realty</span>
                </Link>
              </div>
              <nav className="flex flex-1 flex-col">
                <ul role="list" className="flex flex-1 flex-col gap-y-7">
                  <li>
                    <ul role="list" className="-mx-2 space-y-1">
                      {navigation.map((item) => {
                        if (!userPermissions[item.permission]) return null;
                        const isActive = pathname === item.href;
                        return (
                          <motion.li key={item.name} whileHover={{ x: 4 }}>
                            <Link
                              href={item.href}
                              className={`
                                group flex gap-x-3 rounded-md p-2 text-sm leading-6
                                ${isActive
                                  ? "bg-gray-700 text-red-500"
                                  : "text-gray-400 hover:text-red-500 hover:bg-gray-700"
                                }
                              `}
                      onClick={() => setIsMobileMenuOpen(false)}
                            >
                              <item.icon
                                className={`h-6 w-6 shrink-0 ${
                                  isActive ? "text-red-500" : "text-gray-400 group-hover:text-red-500"
                                }`}
                                aria-hidden="true"
                              />
                              {item.name}
                            </Link>
                          </motion.li>
                        );
                      })}
                    </ul>
                  </li>
                  <li className="mt-auto">
                    <div className="flex items-center justify-between">
                      <ThemeToggle />
                      <Button
                        variant="ghost"
                        className="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-400 hover:bg-gray-700 hover:text-red-500"
                onClick={handleLogout}
                      >
                        <LogOut
                          className="h-6 w-6 shrink-0 text-gray-400 group-hover:text-red-500"
                          aria-hidden="true"
                        />
                        Logout
                      </Button>
                    </div>
                  </li>
                </ul>
              </nav>
            </div>
  );

  if (!user || !userPermissions || !isMounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900">
        <div className="text-gray-100">Loading...</div>
      </div>
    )
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="user-theme-preference"
    >
      <div className="min-h-screen bg-background">
        <div className="flex">
          {/* Desktop Sidebar */}
          <div className="hidden md:fixed md:inset-y-0 md:z-50 md:flex md:w-72 md:flex-col">
            <SidebarContent />
          </div>

          {/* Mobile Sidebar */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetContent side="left" className="w-72 p-0">
              <SidebarContent />
            </SheetContent>
          </Sheet>

          {/* Main Content */}
          <div className="w-full md:pl-72">
            {/* Top Navigation */}
            <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-800 bg-gray-800/95 backdrop-blur px-4 md:px-6">
              {/* Mobile Menu Button */}
              <div className="flex items-center gap-4 md:hidden">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setIsMobileMenuOpen(true)}
                >
                  <MenuIcon className="h-6 w-6 text-gray-400" />
                </Button>
              </div>

              {/* Search */}
              <div className="hidden md:flex md:flex-1 md:items-center md:gap-4">
                <div className="relative w-full max-w-md">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    type="search"
                    placeholder="Search..."
                    className="w-full pl-8 bg-gray-700/50 border-gray-600 text-gray-100 focus:bg-gray-700"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1 h-7 w-7 text-gray-400 hover:text-gray-100"
                      onClick={clearSearch}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                  {/* Search Results Dropdown */}
                  {isSearching && searchResults.length > 0 && (
                    <Card className="absolute top-full left-0 w-full mt-2 bg-gray-800 border-gray-700">
                      <CardContent className="p-2">
                        {searchResults.map((result) => (
                          <Button
                            key={`${result.type}-${result.id}`}
                            variant="ghost"
                            className="w-full justify-start text-left px-2 py-1.5 text-gray-100 hover:bg-gray-700"
                            onClick={() => handleResultClick(result)}
                          >
                            <div>
                              <div className="font-medium">{result.title}</div>
                              <div className="text-sm text-gray-400">{result.subtitle}</div>
                            </div>
                          </Button>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>

              {/* Mobile Search Button */}
              <Button 
                variant="ghost" 
                size="icon"
                className="md:hidden"
                onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
              >
                <Search className="h-5 w-5 text-gray-400" />
              </Button>

              {/* User Menu */}
              <div className="flex items-center gap-4">
                <NotificationsPopover />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="flex items-center gap-2 text-gray-100 hover:text-gray-300"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.avatar} alt={user?.name} />
                        <AvatarFallback>{user?.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="hidden md:inline-block">{user?.name}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={() => setIsProfileOpen(true)}>
                      <Settings className="mr-2 h-4 w-4" />
                      Profile Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </header>

            {/* Mobile Search Bar */}
            {isMobileSearchOpen && (
              <div className="p-4 border-b border-gray-800 md:hidden">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    type="search"
                    placeholder="Search..."
                    className="w-full pl-8 bg-gray-700/50 border-gray-600 text-gray-100 focus:bg-gray-700"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1 h-7 w-7 text-gray-400 hover:text-gray-100"
                      onClick={clearSearch}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {/* Mobile Search Results */}
                {isSearching && searchResults.length > 0 && (
                  <Card className="mt-2 bg-gray-800 border-gray-700">
                    <CardContent className="p-2">
                      {searchResults.map((result) => (
                        <Button
                          key={`${result.type}-${result.id}`}
                          variant="ghost"
                          className="w-full justify-start text-left px-2 py-1.5 text-gray-100 hover:bg-gray-700"
                          onClick={() => {
                            handleResultClick(result);
                            setIsMobileSearchOpen(false);
                          }}
                        >
                          <div>
                            <div className="font-medium">{result.title}</div>
                            <div className="text-sm text-gray-400">{result.subtitle}</div>
                          </div>
                        </Button>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Page Content */}
            <main className="flex-1 overflow-auto p-4 md:p-6">
              {children}
            </main>
          </div>
        </div>

        {/* Profile Settings Dialog */}
        {user && (
          <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <ProfileSettings
                user={user}
                onUpdateAvatar={handleUpdateAvatar}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
    </ThemeProvider>
  );
} 