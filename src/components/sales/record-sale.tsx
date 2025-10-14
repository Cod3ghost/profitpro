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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, doc, runTransaction, serverTimestamp, Timestamp } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';

export default function RecordSale() {
  const firestore = useFirestore();
  const { user } = useUser();
  const productsCollection = useMemoFirebase(() => collection(firestore, 'products'), [firestore]);
  const { data: products, isLoading: productsLoading } = useCollection<Omit<Product, 'id'>>(productsCollection);

  const [selectedProductId, setSelectedProductId] = React.useState<string | undefined>(undefined);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [quantity, setQuantity] = React.useState<number>(1);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { toast } = useToast();

  const selectedProduct = products?.find(p => p.id === selectedProductId);

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

    if (quantity > selectedProduct.stock) {
      toast({
        variant: "destructive",
        title: "Insufficient Stock",
        description: `Only ${selectedProduct.stock} units of ${selectedProduct.name} are available.`,
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
        await runTransaction(firestore, async (transaction) => {
            const productRef = doc(firestore, 'products', selectedProduct.id);
            const salesAgentRef = doc(firestore, 'users', user.uid);
            const salesCollectionRef = collection(salesAgentRef, 'sales');
            const newSaleRef = doc(salesCollectionRef);

            const productDoc = await transaction.get(productRef);
            if (!productDoc.exists()) {
                throw "Product does not exist.";
            }

            const currentStock = productDoc.data().stock;
            if (currentStock < quantity) {
                throw "Insufficient stock.";
            }

            const newStock = currentStock - quantity;
            transaction.update(productRef, { stock: newStock });

            const totalRevenue = selectedProduct.sellingPrice * quantity;
            const totalCost = selectedProduct.costPrice * quantity;
            const profit = totalRevenue - totalCost;

            const newSale: Omit<Sale, 'id'> = {
              productId: selectedProduct.id,
              quantity,
              totalRevenue,
              totalCost,
              profit,
              saleDate: Timestamp.now(),
              salesAgentId: user.uid,
            };

            transaction.set(newSaleRef, newSale);
        });

        toast({
          title: "Sale Recorded!",
          description: `${quantity} x ${selectedProduct.name} sold for ${formatCurrency(selectedProduct.sellingPrice * quantity)}.`,
        });

        setIsDialogOpen(false);
        setSelectedProductId(undefined);
        setQuantity(1);

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
  
  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const handleProductChange = (productId: string) => {
    setSelectedProductId(productId);
    setQuantity(1);
  }

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setQuantity(value > 0 ? value : 1);
  };

  return (
    <div>
        <Dialog open={isDialogOpen} onOpenChange={(isOpen) => {
            setIsDialogOpen(isOpen);
            if (!isOpen) {
                setSelectedProductId(undefined);
                setQuantity(1);
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
                  <Select name="product" onValueChange={handleProductChange} value={selectedProductId} disabled={productsLoading}>
                      <SelectTrigger className="col-span-3">
                          <SelectValue placeholder={productsLoading ? "Loading products..." : "Select a product"} />
                      </SelectTrigger>
                      <SelectContent>
                          {products && products.map(product => (
                              <SelectItem key={product.id} value={product.id} disabled={product.stock === 0}>
                                  {product.name} ({product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'})
                              </SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
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
                                type="number" 
                                min="1" 
                                max={selectedProduct.stock} 
                                value={quantity}
                                onChange={handleQuantityChange}
                                className="col-span-3" 
                                required 
                            />
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4 border-t pt-4 mt-2">
                            <p className="text-right col-span-1 font-medium text-lg">Total:</p>
                            <p className="col-span-3 text-2xl font-bold text-primary">{formatCurrency(selectedProduct.sellingPrice * (quantity || 0))}</p>
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
