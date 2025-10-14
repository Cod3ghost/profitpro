import ProductList from '@/components/products/product-list';

export default function ProductsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline tracking-tight">Product Management</h1>
        <p className="text-muted-foreground">Add, edit, or delete your products.</p>
      </div>
      <ProductList />
    </div>
  );
}
