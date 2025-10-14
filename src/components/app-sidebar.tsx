'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Package,
  DollarSign,
  LogOut,
  Settings,
  User as UserIcon,
} from 'lucide-react';
import Logo from './logo';
import { useAuth, useUser } from '@/firebase';
import { useRole } from '@/hooks/use-role';
import { Skeleton } from './ui/skeleton';

export function AppSidebar() {
  const pathname = usePathname();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const { role, isLoading: isRoleLoading } = useRole();
  const router = useRouter();

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/');
  };

  const adminMenuItems = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      href: '/products',
      label: 'Products',
      icon: Package,
    },
    {
      href: '/sales',
      label: 'Sales',
      icon: DollarSign,
    },
  ];

  const agentMenuItems = [
    {
      href: '/sales',
      label: 'Sales',
      icon: DollarSign,
    },
  ];

  const menuItems = role === 'admin' ? adminMenuItems : agentMenuItems;

  const isLoading = isUserLoading || isRoleLoading;

  if (!user && !isLoading) {
    // Redirect or show nothing if not authenticated, after loading is complete
    if (typeof window !== 'undefined') {
      router.push('/');
    }
    return null;
  }
  
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <Logo className="w-8 h-8" />
          <span className="text-xl font-semibold font-headline">ProfitPro</span>
          <div className="ml-auto">
            <SidebarTrigger />
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {isLoading ? (
          <div className="p-2 space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : (
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href}>
                  <SidebarMenuButton
                    isActive={pathname.startsWith(item.href)}
                    tooltip={item.label}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        )}
      </SidebarContent>
      <SidebarFooter>
        <Separator className="my-2" />
        <div className="flex items-center gap-3 p-2">
          {isLoading ? (
            <>
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex flex-col gap-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </>
          ) : user ? (
            <>
              <Avatar>
                {user.photoURL ? (
                  <AvatarImage src={user.photoURL} alt={user.displayName || 'User'} />
                ) : (
                   <AvatarFallback>
                    {user.isAnonymous ? <UserIcon/> : (user.email?.charAt(0).toUpperCase() || 'U')}
                   </AvatarFallback>
                )}
              </Avatar>
              <div className="flex flex-col overflow-hidden">
                <span className="font-medium truncate">{user.isAnonymous ? "Sales Agent" : (user.displayName || user.email)}</span>
                <span className="text-xs text-muted-foreground truncate">
                  {user.isAnonymous ? "Anonymous User" : role?.toUpperCase()}
                </span>
              </div>
            </>
          ) : null}

          <div className="ml-auto flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
