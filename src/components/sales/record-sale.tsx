'use client';

import * as React from 'react';
import type { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Minus, Plus, Loader2 } from 'lucide-react';
import { Combobox } from '@/components/ui/combobox';
import { useUser } from '@/hooks/use-supabase-user';
import { createClient } from '@/lib/supabase/client';
import { recordSale } from '@/lib/actions-supabase';

const RECENT_PRODUCTS_KEY = 'profitpro_recent_products';
const MAX_RECENT = 5;

function getRecentProducts(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_PRODUCTS_KEY) || '[]');
  } catch {
    return [];
  }
}

function addRecentProduct(productId: string) {
  const recent = getRecentProducts().filter(id => id !== productId);
  recent.unshift(productId);
  localStorage.setItem(RECENT_PRODUCTS_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
}

interface RecordSaleProps {
  onSaleRecorded?: () => void;
}

export default function RecordSale({ onSaleRecorded }: RecordSaleProps) {
  const supabase = createClient();
  const { user } = useUser();
  const [products, setProducts] = React.useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = React.useState(true);
  const [selectedProductId, setSelectedProductId] = React.useState<string | undefined>(undefined);
  const [quantity, setQuantity] = React.useState<string>('1');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [recentProductIds, setRecentProductIds] = React.useState<string[]>([]);
  const quantityRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const selectedProduct = products?.find(p => p.id === selectedProductId);

  // Load recent products from localStorage on mount
  React.useEffect(() => {
    setRecentProductIds(getRecentProducts());
  }, []);

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

  const handleProductChange = (productId: string) => {
    setSelectedProductId(productId);
    setQuantity('1');
    // Auto-focus quantity field so the agent can immediately type or use +/-
    setTimeout(() => {
      quantityRef.current?.focus();
      quantityRef.current?.select();
    }, 50);
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d+$/.test(value)) {
      setQuantity(value);
    }
  };

  const adjustQuantity = (delta: number) => {
    const current = parseInt(quantity, 10) || 0;
    const next = Math.max(1, current + delta);
    setQuantity(String(next));
  };

  const resetForm = () => {
    setSelectedProductId(undefined);
    setQuantity('1');
  };

  const handleSaleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedProduct || !user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a product and ensure you are logged in.',
      });
      return;
    }

    const quantityNum = parseInt(quantity, 10);

    if (!quantity || isNaN(quantityNum) || quantityNum < 1) {
      toast({
        variant: 'destructive',
        title: 'Invalid Quantity',
        description: 'Please enter a quantity greater than 0.',
      });
      return;
    }

    if (quantityNum > selectedProduct.stock) {
      toast({
        variant: 'destructive',
        title: 'Insufficient Stock',
        description: `Only ${selectedProduct.stock} units of ${selectedProduct.name} are available.`,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await recordSale(selectedProduct.id, quantityNum, user.id);

      if (result.success) {
        // Optimistic stock update — no need to refetch all products
        setProducts(prev =>
          prev.map(p =>
            p.id === selectedProduct.id ? { ...p, stock: p.stock - quantityNum } : p
          )
        );

        // Track recently used product so it appears at top next time
        addRecentProduct(selectedProduct.id);
        setRecentProductIds(getRecentProducts());

        toast({
          title: 'Sale Recorded!',
          description: `${quantityNum} × ${selectedProduct.name} — ${formatCurrency(result.totalRevenue || 0)}.`,
        });

        resetForm();
        onSaleRecorded?.();
      } else {
        toast({
          variant: 'destructive',
          title: 'Sale Failed',
          description: result.message,
        });
      }
    } catch (error: any) {
      console.error('Sale transaction failed:', error);
      toast({
        variant: 'destructive',
        title: 'Sale Failed',
        description: error.toString(),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);

  // Recent products float to the top of the dropdown list
  const comboboxOptions = React.useMemo(() => {
    const recentSet = new Set(recentProductIds);
    const recentProducts = recentProductIds
      .map(id => products.find(p => p.id === id))
      .filter(Boolean) as Product[];
    const otherProducts = products.filter(p => !recentSet.has(p.id));

    const toOption = (p: Product) => ({
      value: p.id,
      label: `${p.name} (${p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'})`,
      disabled: p.stock === 0,
    });

    return [...recentProducts.map(toOption), ...otherProducts.map(toOption)];
  }, [products, recentProductIds]);

  const quantityNum = parseInt(quantity, 10) || 0;
  const total = selectedProduct ? selectedProduct.sellingPrice * quantityNum : 0;
  const overStock = selectedProduct ? quantityNum > selectedProduct.stock : false;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Record New Sale</CardTitle>
        <CardDescription>
          Select a product and enter the quantity. Quantity defaults to 1 — use +/− to adjust quickly.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSaleSubmit}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:flex-wrap lg:flex-nowrap">
            {/* Product selector */}
            <div className="flex-1 min-w-0">
              <Label htmlFor="product" className="mb-1.5 block text-sm font-medium">
                Product
              </Label>
              <Combobox
                options={comboboxOptions}
                value={selectedProductId}
                onValueChange={handleProductChange}
                placeholder={productsLoading ? 'Loading products…' : 'Search or select a product…'}
                searchPlaceholder="Type to search…"
                emptyMessage="No product found."
                disabled={productsLoading}
              />
            </div>

            {/* Quantity with +/- buttons */}
            <div className="shrink-0">
              <Label htmlFor="quantity" className="mb-1.5 block text-sm font-medium">
                Quantity
              </Label>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 w-10"
                  onClick={() => adjustQuantity(-1)}
                  disabled={!selectedProduct || quantityNum <= 1}
                  tabIndex={-1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  ref={quantityRef}
                  id="quantity"
                  name="quantity"
                  type="text"
                  inputMode="numeric"
                  pattern="\d*"
                  value={quantity}
                  onChange={handleQuantityChange}
                  className="w-20 text-center font-semibold text-base"
                  disabled={!selectedProduct}
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 w-10"
                  onClick={() => adjustQuantity(1)}
                  disabled={!selectedProduct || overStock}
                  tabIndex={-1}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Unit price + running total */}
            <div className="shrink-0 flex flex-col justify-end">
              <p className="text-sm text-muted-foreground h-5 mb-1.5">
                {selectedProduct
                  ? `@ ${formatCurrency(selectedProduct.sellingPrice)} each`
                  : ''}
              </p>
              <div className="flex items-center h-10">
                <span className="text-2xl font-bold text-primary tabular-nums">
                  {selectedProduct ? formatCurrency(total) : '—'}
                </span>
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              size="lg"
              className="bg-accent hover:bg-accent/90 shrink-0 h-10"
              disabled={!selectedProduct || isSubmitting || quantityNum < 1 || overStock}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <PlusCircle className="mr-2 h-4 w-4" />
              )}
              {isSubmitting ? 'Recording…' : 'Record Sale'}
            </Button>
          </div>

          {overStock && selectedProduct && (
            <p className="mt-2 text-sm text-destructive">
              Only {selectedProduct.stock} unit{selectedProduct.stock !== 1 ? 's' : ''} available.
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
