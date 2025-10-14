import RecordSale from '@/components/sales/record-sale';
import { mockProducts } from '@/lib/data';

export default function SalesPage() {
  const products = mockProducts;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline tracking-tight">Sales Terminal</h1>
        <p className="text-muted-foreground">Record a new sales transaction.</p>
      </div>
      <RecordSale initialProducts={products} />
    </div>
  );
}
