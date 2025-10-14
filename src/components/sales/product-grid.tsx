'use client';

import * as React from 'react';
import type { Product, Sale } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

type ProductGridProps = {
  initialProducts: Product[];
};

export default function ProductGrid({ initialProducts }: ProductGridProps) {
  const [products, setProducts] = React.useState<Product[]>(initialProducts);
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const { toast } = useToast();

  const handleOpenDialog = (product: Product) => {
    setSelectedProduct(product);
    setIsDialogOpen(true);
  };

  const handleSaleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const formData = new FormData(e.currentTarget);
    const quantity = parseInt(formData.get('quantity') as string, 10);

    if (quantity > selectedProduct.stock) {
      toast({
        variant: "destructive",
        title: "Insufficient Stock",
        description: `Only ${selectedProduct.stock} units of ${selectedProduct.name} are available.`,
      });
      return;
    }

    const totalRevenue = selectedProduct.sellingPrice * quantity;
    const totalCost = selectedProduct.costPrice * quantity;
    const profit = totalRevenue - totalCost;

    const newSale: Sale = {
      id: `sale-${Date.now()}`,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      quantity,
      totalRevenue,
      totalCost,
      profit,
      date: new Date().toISOString(),
    };

    // In a real app, this would be an API call. Here we just update local state.
    setProducts(products.map(p => 
        p.id === selectedProduct.id ? {...p, stock: p.stock - quantity} : p
    ));
    
    console.log('New Sale Recorded:', newSale);

    toast({
      title: "Sale Recorded!",
      description: `${quantity} x ${selectedProduct.name} sold for ${formatCurrency(totalRevenue)}.`,
    });

    setIsDialogOpen(false);
    setSelectedProduct(null);
  };
  
  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);


  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <Card key={product.id} className="flex flex-col">
            <CardHeader className="p-0">
               <Image
                  src={product.imageUrl}
                  alt={product.name}
                  width={400}
                  height={300}
                  className="rounded-t-lg object-cover aspect-[4/3]"
                  data-ai-hint={product.imageHint}
                />
            </CardHeader>
            <CardContent className="flex-grow p-4">
              <CardTitle className="text-lg font-semibold">{product.name}</CardTitle>
              <CardDescription className="text-sm text-muted-foreground pt-1">
                {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
              </CardDescription>
              <p className="text-xl font-bold text-primary pt-2">{formatCurrency(product.sellingPrice)}</p>
            </CardContent>
            <CardFooter className="p-4 pt-0">
              <Button
                onClick={() => handleOpenDialog(product)}
                disabled={product.stock === 0}
                className="w-full bg-accent hover:bg-accent/90"
              >
                Record Sale
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {selectedProduct && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Record Sale: {selectedProduct.name}</DialogTitle>
              <DialogDescription>
                Enter the quantity sold. Available stock: {selectedProduct.stock}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="quantity" className="text-right">Quantity</Label>
                  <Input id="quantity" name="quantity" type="number" min="1" max={selectedProduct.stock} defaultValue="1" className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <p className="text-right col-span-1 font-medium">Total:</p>
                    <p className="col-span-3 text-lg font-bold">{formatCurrency(selectedProduct.sellingPrice)}</p>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary">Cancel</Button>
                </DialogClose>
                <Button type="submit">Confirm Sale</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
