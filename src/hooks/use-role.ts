
'use client';

import { useMemo } from 'react';
import { useDoc } from '@/firebase/firestore/use-doc';
import { useUser } from '@/firebase/provider';
import { doc, getFirestore } from 'firebase/firestore';

export type UserRole = 'admin' | 'agent' | null;

export const useRole = (): { role: UserRole; isLoading: boolean } => {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const firestore = getFirestore();

  const adminRoleRef = useMemo(() => {
    if (!user || user.isAnonymous) return null;
    return doc(firestore, 'roles_admin', user.uid);
  }, [user, firestore]);

  const { data: adminRoleDoc, isLoading: isRoleLoading } = useDoc(adminRoleRef);
  
  const isLoading = isAuthLoading || (user && !user.isAnonymous && isRoleLoading);

  const role = useMemo((): UserRole => {
    if (isLoading) return null;
    if (!user) return null;
    if (user.isAnonymous) return 'agent';
    return adminRoleDoc ? 'admin' : 'agent';
  }, [user, adminRoleDoc, isLoading]);

  return { role, isLoading };
};
