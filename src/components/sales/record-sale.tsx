'use client';

import * as React from 'react';
import type { Product, Sale } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle } from 'lucide-react';
import { Combobox } from '@/components/ui/combobox';
import { useUser } from '@/hooks/use-supabase-user';
import { createClient } from '@/lib/supabase/client';
import { recordSale } from '@/lib/actions-supabase';

export default function RecordSale() {
  const supabase = createClient();
  const { user } = useUser();
  const [products, setProducts] = React.useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = React.useState(true);
  const [selectedProductId, setSelectedProductId] = React.useState<string | undefined>(undefined);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [quantity, setQuantity] = React.useState<string>('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { toast } = useToast();

  const selectedProduct = products?.find(p => p.id === selectedProductId);

  // Fetch products from Supabase
  React.useEffect(() => {
    async function fetchProducts() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('name');

        if (error) {
          console.error('Error fetching products:', error);
        } else {
          const mappedProducts = data.map((p) => ({
            id: p.id,
            name: p.name,
            costPrice: p.cost_price,
            sellingPrice: p.selling_price,
            stock: p.stock,
            imageUrl: p.image_url,
            imageHint: p.image_hint,
          }));
          setProducts(mappedProducts as Product[]);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setProductsLoading(false);
      }
    }

    fetchProducts();
  }, [supabase]);

  const handleSaleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedProduct || !user) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Please select a product and ensure you are logged in.",
        });
        return;
    }

    const quantityNum = parseInt(quantity, 10);

    if (!quantity || isNaN(quantityNum) || quantityNum < 1) {
      toast({
        variant: "destructive",
        title: "Invalid Quantity",
        description: "Please enter a quantity greater than 0.",
      });
      return;
    }

    if (quantityNum > selectedProduct.stock) {
      toast({
        variant: "destructive",
        title: "Insufficient Stock",
        description: `Only ${selectedProduct.stock} units of ${selectedProduct.name} are available.`,
      });
      return;
    }

    setIsSubmitting(true);

    try {
        const result = await recordSale(selectedProduct.id, quantityNum, user.id);

        if (result.success) {
            toast({
              title: "Sale Recorded!",
              description: `${quantityNum} x ${selectedProduct.name} sold for ${formatCurrency(result.totalRevenue || 0)}.`,
            });

            setIsDialogOpen(false);
            setSelectedProductId(undefined);
            setQuantity('');

            // Refetch products to update stock
            const { data } = await supabase
              .from('products')
              .select('*')
              .order('name');

            if (data) {
              const mappedProducts = data.map((p) => ({
                id: p.id,
                name: p.name,
                costPrice: p.cost_price,
                sellingPrice: p.selling_price,
                stock: p.stock,
                imageUrl: p.image_url,
                imageHint: p.image_hint,
              }));
              setProducts(mappedProducts as Product[]);
            }
        } else {
            toast({
                variant: "destructive",
                title: "Sale Failed",
                description: result.message,
            });
        }
    } catch (error: any) {
        console.error("Sale transaction failed: ", error);
        toast({
            variant: "destructive",
            title: "Sale Failed",
            description: error.toString(),
        });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);

  const handleProductChange = (productId: string) => {
    setSelectedProductId(productId);
    setQuantity('');
  }

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numeric input or empty string
    if (value === '' || /^\d+$/.test(value)) {
      setQuantity(value);
    }
  };

  return (
    <div>
        <Dialog open={isDialogOpen} onOpenChange={(isOpen) => {
            setIsDialogOpen(isOpen);
            if (!isOpen) {
                setSelectedProductId(undefined);
                setQuantity('');
            }
        }}>
          <DialogTrigger asChild>
            <Button size="lg" className="bg-accent hover:bg-accent/90">
              <PlusCircle className="mr-2 h-4 w-4" /> Enter New Sale
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Record a New Sale</DialogTitle>
              <DialogDescription>
                Select a product and enter the quantity sold.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="product" className="text-right">Product</Label>
                  <div className="col-span-3">
                    <Combobox
                      options={products.map(product => ({
                        value: product.id,
                        label: `${product.name} (${product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'})`,
                        disabled: product.stock === 0
                      }))}
                      value={selectedProductId}
                      onValueChange={handleProductChange}
                      placeholder={productsLoading ? "Loading products..." : "Search or select a product..."}
                      searchPlaceholder="Type to search products..."
                      emptyMessage="No product found."
                      disabled={productsLoading}
                    />
                  </div>
                </div>

                {selectedProduct && (
                    <>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="selling-price" className="text-right">Sale Price</Label>
                            <Input id="selling-price" value={formatCurrency(selectedProduct.sellingPrice)} className="col-span-3" readOnly disabled />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="cost-price" className="text-right">Cost Price</Label>
                            <Input id="cost-price" value={formatCurrency(selectedProduct.costPrice)} className="col-span-3" readOnly disabled />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="quantity" className="text-right">Quantity</Label>
                            <Input
                                id="quantity"
                                name="quantity"
                                type="text"
                                inputMode="numeric"
                                pattern="\d*"
                                placeholder="Enter quantity"
                                value={quantity}
                                onChange={handleQuantityChange}
                                className="col-span-3"
                                required
                            />
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4 border-t pt-4 mt-2">
                            <p className="text-right col-span-1 font-medium text-lg">Total:</p>
                            <p className="col-span-3 text-2xl font-bold text-primary">{formatCurrency(selectedProduct.sellingPrice * (parseInt(quantity, 10) || 0))}</p>
                        </div>
                    </>
                )}
                
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={!selectedProduct || isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Confirm Sale'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
    </div>
  );
}
