'use client';
import { useMemo } from 'react';
import OverviewCards from '@/components/dashboard/overview-cards';
import SalesChart from '@/components/dashboard/sales-chart';
import TrendAnalysis from '@/components/dashboard/trend-analysis';
import { useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useQuery } from '@tanstack/react-query';
import type { Sale, Product } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useRole } from '@/hooks/use-role';
import AllSalesTable from '@/components/dashboard/all-sales-table';

async function fetchAllSales(firestore: any): Promise<Sale[]> {
  const usersSnapshot = await getDocs(collection(firestore, 'users'));
  const allSales: Sale[] = [];
  for (const userDoc of usersSnapshot.docs) {
    const salesCollection = collection(firestore, 'users', userDoc.id, 'sales');
    const salesSnapshot = await getDocs(salesCollection);
    salesSnapshot.forEach(saleDoc => {
      allSales.push({ id: saleDoc.id, ...saleDoc.data() } as Sale);
    });
  }
  return allSales;
}

export default function DashboardPage() {
  const firestore = useFirestore();
  const { role } = useRole();

  const { data: sales, isLoading: salesLoading } = useQuery({
    queryKey: ['allSales'],
    queryFn: () => fetchAllSales(firestore),
    enabled: !!firestore,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, here is your business overview.</p>
      </div>
      
      {salesLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : (
        <OverviewCards salesData={sales || []} />
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {salesLoading ? <Skeleton className="h-[430px]" /> : <SalesChart salesData={sales || []} />}
        </div>
        <div className="lg:col-span-1">
          {salesLoading ? <Skeleton className="h-[430px]" /> : <TrendAnalysis salesData={sales || []} />}
        </div>
      </div>
      
      {role === 'admin' && (
        <div>
          {salesLoading ? <Skeleton className="h-[430px]" /> : <AllSalesTable salesData={sales || []} />}
        </div>
      )}
    </div>
  );
}
