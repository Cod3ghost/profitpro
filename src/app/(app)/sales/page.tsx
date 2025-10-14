import ProductGrid from '@/components/sales/product-grid';
import { mockProducts } from '@/lib/data';

export default function SalesPage() {
  const products = mockProducts;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline tracking-tight">Sales Terminal</h1>
        <p className="text-muted-foreground">Select a product to record a sale.</p>
      </div>
      <ProductGrid initialProducts={products} />
    </div>
  );
}
