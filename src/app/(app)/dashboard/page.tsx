import { mockSales, mockProducts } from '@/lib/data';
import OverviewCards from '@/components/dashboard/overview-cards';
import SalesChart from '@/components/dashboard/sales-chart';
import TrendAnalysis from '@/components/dashboard/trend-analysis';

export default function DashboardPage() {
  const sales = mockSales;
  const products = mockProducts;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, here is your business overview.</p>
      </div>
      
      <OverviewCards salesData={sales} />

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SalesChart salesData={sales} />
        </div>
        <div className="lg:col-span-1">
          <TrendAnalysis salesData={sales} />
        </div>
      </div>
    </div>
  );
}
