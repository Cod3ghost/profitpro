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
  Users,
  User as UserIcon,
} from 'lucide-react';
import Logo from './logo';
import { useUser } from '@/hooks/use-supabase-user';
import { useRole } from '@/hooks/use-supabase-role';
import { Skeleton } from './ui/skeleton';
import { createClient } from '@/lib/supabase/client';

export function AppSidebar() {
  const pathname = usePathname();
  const supabase = createClient();
  const { user, isLoading: isUserLoading } = useUser();
  const { role, isLoading: isRoleLoading } = useRole();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
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
    {
      href: '/users',
      label: 'Users',
      icon: Users,
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

  React.useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/');
    }
  }, [isUserLoading, user, router]);

  if (isLoading || !user || role === 'loading') {
    return (
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2">
              <Logo className="w-8 h-8" />
              <span className="text-xl font-semibold font-headline">ProfitPro</span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <div className="p-2 space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
            </div>
          </SidebarContent>
           <SidebarFooter>
            <Separator className="my-2" />
            <div className="flex items-center gap-3 p-2">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex flex-col gap-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
            </div>
          </SidebarFooter>
        </Sidebar>
    );
  }
  
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <Logo className="w-8 h-8" />
          <span className="text-xl font-semibold font-headline">ProfitPro</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
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
      </SidebarContent>
      <SidebarFooter>
        <Separator className="my-2" />
        <div className="flex items-center gap-3 p-2">
          {user ? (
            <>
              <Avatar>
                {user.user_metadata?.avatar_url ? (
                  <AvatarImage src={user.user_metadata.avatar_url} alt={user.user_metadata?.full_name || 'User'} />
                ) : (
                   <AvatarFallback>
                    {user.email?.charAt(0).toUpperCase() || 'U'}
                   </AvatarFallback>
                )}
              </Avatar>
              <div className="flex flex-col overflow-hidden">
                <span className="font-medium truncate">{user.user_metadata?.full_name || user.email}</span>
                <span className="text-xs text-muted-foreground truncate">
                  {role?.toUpperCase()}
                </span>
              </div>
            </>
          ) : null}

          <div className="ml-auto flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push('/settings')}>
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
