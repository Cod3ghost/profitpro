
'use client';

import { useMemo } from 'react';
import { useDoc } from '@/firebase/firestore/use-doc';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

export type UserRole = 'admin' | 'agent' | 'loading' | null;

export const useRole = (): { role: UserRole; isLoading: boolean } => {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const firestore = useFirestore();

  const adminRoleRef = useMemoFirebase(() => {
    if (!user || user.isAnonymous) return null;
    return doc(firestore, 'roles_admin', user.uid);
  }, [user, firestore]);

  const { data: adminRoleDoc, isLoading: isRoleDocLoading } = useDoc(adminRoleRef);
  
  const isLoading = isAuthLoading || (!!user && !user.isAnonymous && isRoleDocLoading);

  const role = useMemo((): UserRole => {
    if (isLoading) return 'loading';
    if (!user) return null;
    if (user.isAnonymous) return 'agent';
    
    // If the adminRoleDoc exists, the user is an admin.
    if (adminRoleDoc) {
      return 'admin';
    }
    
    // Otherwise, they are an agent.
    return 'agent';
  }, [user, adminRoleDoc, isLoading]);

  return { role, isLoading };
};
