'use client';

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";
import { useRouter } from 'next/navigation';

interface UserProfileProps {
  username: string;
  role: string;
  className?: string;
}

export function UserProfile({ username, role, className }: UserProfileProps) {
  const router = useRouter();

  const handleLogout = () => {
    // Clear all auth data
    localStorage.clear();
    
    // Clear the auth cookie
    document.cookie = 'user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    // Redirect to root page
    router.push('/');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className={`flex items-center gap-2 ${className || ''}`}>
          <Image
            src="/placeholder-avatar.png"
            alt={username}
            width={32}
            height={32}
            className="rounded-full bg-gray-100"
            priority
          />
          <div className="text-left">
            <p className="text-sm font-medium">{username}</p>
            <p className="text-xs text-gray-500">{role}</p>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/settings/profile')}>
          Profile Settings
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/settings')}>
          App Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-red-500 hover:text-red-600">
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 