'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from './use-supabase-user';

export type UserRole = 'admin' | 'agent' | 'loading' | null;

export function useRole(): { role: UserRole; isLoading: boolean } {
  const { user, isLoading: isUserLoading } = useUser();
  const [role, setRole] = useState<UserRole>('loading');
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchRole() {
      if (isUserLoading) {
        return;
      }

      if (!user) {
        setRole(null);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching role:', error.message || error);
          // If user doesn't have a profile yet, default to agent
          setRole('agent');
        } else if (data) {
          setRole(data.role as 'admin' | 'agent');
        } else {
          // No user profile found
          console.warn('No user profile found for user:', user.id);
          setRole('agent');
        }
      } catch (error) {
        console.error('Error fetching role:', error);
        setRole('agent');
      } finally {
        setIsLoading(false);
      }
    }

    fetchRole();
  }, [user, isUserLoading, supabase]);

  return { role, isLoading };
}
