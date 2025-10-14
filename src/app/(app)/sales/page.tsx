'use client';
import RecordSale from '@/components/sales/record-sale';
import SalesHistory from '@/components/sales/sales-history';

export default function SalesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline tracking-tight">Sales</h1>
        <p className="text-muted-foreground">Record a new sales transaction and view sales history.</p>
      </div>
      <RecordSale />
      <SalesHistory />
    </div>
  );
}
