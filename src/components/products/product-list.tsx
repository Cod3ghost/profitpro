'use client';

import * as React from 'react';
import type { Product } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useRole } from '@/hooks/use-supabase-role';
import { Skeleton } from '../ui/skeleton';
import { createClient } from '@/lib/supabase/client';
import { createProduct, updateProduct, deleteProduct } from '@/lib/actions-supabase';

export default function ProductList() {
  const supabase = createClient();
  const [products, setProducts] = React.useState<Product[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);
  const { toast } = useToast();
  const { role } = useRole();

  // Fetch products from Supabase
  const fetchProducts = React.useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching products:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load products.',
        });
      } else {
        // Map Supabase data to Product format
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
      setIsLoading(false);
    }
  }, [supabase, toast]);

  React.useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (role !== 'admin') {
      toast({ variant: "destructive", title: "Permission Denied", description: "Only admins can manage products." });
      return;
    }

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const costPrice = parseFloat(formData.get('costPrice') as string);
    const sellingPrice = parseFloat(formData.get('sellingPrice') as string);
    const stock = parseInt(formData.get('stock') as string, 10);

    try {
      let result;
      if (editingProduct) {
        // Update existing product
        result = await updateProduct(editingProduct.id, name, costPrice, sellingPrice, stock);
      } else {
        // Add new product
        const randomImage = PlaceHolderImages[Math.floor(Math.random() * PlaceHolderImages.length)];
        result = await createProduct(name, costPrice, sellingPrice, stock, randomImage.imageUrl, randomImage.imageHint);
      }

      if (result.success) {
        toast({ title: editingProduct ? "Product Updated" : "Product Added", description: result.message });
        setEditingProduct(null);
        setIsDialogOpen(false);
        await fetchProducts();
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.message,
        });
      }
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save product.',
      });
    }
  };

  const handleEdit = (product: Product) => {
    if (role !== 'admin') return;
    setEditingProduct(product);
    setIsDialogOpen(true);
  };

  const handleDelete = async (product: Product) => {
    if (role !== 'admin') return;

    try {
      const result = await deleteProduct(product.id);

      if (result.success) {
        toast({ variant: "destructive", title: "Product Deleted", description: `${product.name} has been removed.` });
        await fetchProducts();
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.message,
        });
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete product.',
      });
    }
  };
  
  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);

  return (
    <div>
      <div className="flex justify-end mb-4">
        {role === 'admin' && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingProduct(null)}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
                <DialogDescription>
                  {editingProduct ? 'Update the details of your product.' : 'Fill in the details for the new product.'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleFormSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Name</Label>
                    <Input id="name" name="name" defaultValue={editingProduct?.name || ''} className="col-span-3" required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="costPrice" className="text-right">Cost Price</Label>
                    <Input id="costPrice" name="costPrice" type="number" step="0.01" defaultValue={editingProduct?.costPrice || ''} className="col-span-3" required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="sellingPrice" className="text-right">Selling Price</Label>
                    <Input id="sellingPrice" name="sellingPrice" type="number" step="0.01" defaultValue={editingProduct?.sellingPrice || ''} className="col-span-3" required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="stock" className="text-right">Stock</Label>
                    <Input id="stock" name="stock" type="number" defaultValue={editingProduct?.stock || ''} className="col-span-3" required />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="secondary">Cancel</Button>
                  </DialogClose>
                  <Button type="submit" className="bg-accent hover:bg-accent/90">{editingProduct ? 'Save Changes' : 'Create Product'}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Cost Price</TableHead>
              <TableHead className="text-right">Selling Price</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              {role === 'admin' && <TableHead className="w-[100px]">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-10 w-10 rounded-md"/></TableCell>
                <TableCell><Skeleton className="h-6 w-32"/></TableCell>
                <TableCell><Skeleton className="h-6 w-20 ml-auto"/></TableCell>
                <TableCell><Skeleton className="h-6 w-20 ml-auto"/></TableCell>
                <TableCell><Skeleton className="h-6 w-16 ml-auto"/></TableCell>
                {role === 'admin' && <TableCell><div className="flex gap-2 justify-end"><Skeleton className="h-8 w-8" /><Skeleton className="h-8 w-8" /></div></TableCell>}
              </TableRow>
            ))}
            {products && products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    width={40}
                    height={40}
                    className="rounded-md object-cover"
                    data-ai-hint={product.imageHint}
                  />
                </TableCell>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell className="text-right">{formatCurrency(product.costPrice)}</TableCell>
                <TableCell className="text-right">{formatCurrency(product.sellingPrice)}</TableCell>
                <TableCell className="text-right">{product.stock}</TableCell>
                {role === 'admin' && (
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(product)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(product)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
         {(!products || products.length === 0) && !isLoading && (
          <div className="text-center p-8 text-muted-foreground">No products found. {role === 'admin' && 'Add a new product to get started.'}</div>
        )}
      </div>
    </div>
  );
}
