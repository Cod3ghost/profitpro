'use client';
import { useMemo } from 'react';
import OverviewCards from '@/components/dashboard/overview-cards';
import SalesChart from '@/components/dashboard/sales-chart';
import TrendAnalysis from '@/components/dashboard/trend-analysis';
import { useQuery } from '@tanstack/react-query';
import type { Sale, Product } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useRole } from '@/hooks/use-supabase-role';
import AllSalesTable from '@/components/dashboard/all-sales-table';
import { createClient } from '@/lib/supabase/client';

async function fetchAllSales(): Promise<Sale[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('sales')
    .select('*')
    .order('sale_date', { ascending: false });

  if (error) {
    console.error('Error fetching sales:', error);
    return [];
  }

  return data.map((s) => ({
    id: s.id,
    productId: s.product_id,
    quantity: s.quantity,
    totalRevenue: s.total_revenue,
    totalCost: s.total_cost,
    profit: s.profit,
    saleDate: new Date(s.sale_date),
    salesAgentId: s.sales_agent_id,
  })) as Sale[];
}

export default function DashboardPage() {
  const { role } = useRole();

  const { data: sales, isLoading: salesLoading } = useQuery({
    queryKey: ['allSales'],
    queryFn: fetchAllSales,
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
