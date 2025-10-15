'use client';

import * as React from 'react';
import { useUser } from '@/hooks/use-supabase-user';
import { useRole } from '@/hooks/use-supabase-role';
import type { Sale, Product, SalesAgent } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '../ui/skeleton';
import { createClient } from '@/lib/supabase/client';
import { updateSale, deleteSale } from '@/lib/actions-supabase';


export default function SalesHistory() {
  const { user } = useUser();
  const { role } = useRole();
  const supabase = createClient();
  const [sales, setSales] = React.useState<Sale[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [users, setUsers] = React.useState<SalesAgent[]>([]);
  const [salesLoading, setSalesLoading] = React.useState(true);
  const [productsLoading, setProductsLoading] = React.useState(true);
  const [usersLoading, setUsersLoading] = React.useState(true);
  const [editingSale, setEditingSale] = React.useState<Sale | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const { toast } = useToast();

  // Fetch sales from Supabase
  React.useEffect(() => {
    async function fetchSales() {
      if (!user || !role) {
        setSales([]);
        setSalesLoading(false);
        return;
      }

      try {
        let query = supabase
          .from('sales')
          .select('*')
          .order('sale_date', { ascending: false });

        // Agents can only see their own sales, admins see all sales
        if (role === 'agent') {
          query = query.eq('sales_agent_id', user.id);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error fetching sales:', error);
        } else {
          const mappedSales = data.map((s) => ({
            id: s.id,
            productId: s.product_id,
            quantity: s.quantity,
            totalRevenue: s.total_revenue,
            totalCost: s.total_cost,
            profit: s.profit,
            saleDate: new Date(s.sale_date),
            salesAgentId: s.sales_agent_id,
          }));
          setSales(mappedSales as Sale[]);
        }
      } catch (error) {
        console.error('Error fetching sales:', error);
      } finally {
        setSalesLoading(false);
      }
    }

    fetchSales();
  }, [user, role, supabase]);

  // Fetch products from Supabase
  React.useEffect(() => {
    async function fetchProducts() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*');

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

  // Fetch users from Supabase (for admin to see who made the sale)
  React.useEffect(() => {
    async function fetchUsers() {
      if (role !== 'admin') {
        setUsersLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, first_name, last_name, email');

        if (error) {
          console.error('Error fetching users:', error);
        } else {
          const mappedUsers = data.map((u) => ({
            id: u.id,
            firstName: u.first_name,
            lastName: u.last_name,
            email: u.email,
          }));
          setUsers(mappedUsers as SalesAgent[]);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setUsersLoading(false);
      }
    }

    fetchUsers();
  }, [role, supabase]);

  const productsMap = React.useMemo(() => {
    if (!products) return new Map();
    return new Map(products.map(p => [p.id, p]));
  }, [products]);

  const usersMap = React.useMemo(() => {
    if (!users) return new Map();
    return new Map(users.map(u => [u.id, u]));
  }, [users]);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);

  const formatDate = (date: any) => {
    if (!date) return '';
    const jsDate = date instanceof Date ? date : new Date(date);
    return format(jsDate, 'PPpp');
  }

  const refetchSales = React.useCallback(async () => {
    if (!user || !role) return;

    try {
      let query = supabase
        .from('sales')
        .select('*')
        .order('sale_date', { ascending: false });

      // Agents can only see their own sales, admins see all sales
      if (role === 'agent') {
        query = query.eq('sales_agent_id', user.id);
      }

      const { data, error } = await query;

      if (!error && data) {
        const mappedSales = data.map((s) => ({
          id: s.id,
          productId: s.product_id,
          quantity: s.quantity,
          totalRevenue: s.total_revenue,
          totalCost: s.total_cost,
          profit: s.profit,
          saleDate: new Date(s.sale_date),
          salesAgentId: s.sales_agent_id,
        }));
        setSales(mappedSales as Sale[]);
      }
    } catch (error) {
      console.error('Error refetching sales:', error);
    }
  }, [user, role, supabase]);

  const handleEdit = (sale: Sale) => {
    if (role !== 'admin') return;
    setEditingSale(sale);
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (role !== 'admin' || !editingSale) return;

    const formData = new FormData(e.currentTarget);
    const quantity = parseInt(formData.get('quantity') as string, 10);

    const result = await updateSale(editingSale.id, quantity, editingSale.productId, editingSale.quantity);

    if (result.success) {
      toast({ title: 'Sale Updated', description: result.message });
      setIsEditDialogOpen(false);
      setEditingSale(null);
      await refetchSales();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.message });
    }
  };

  const handleDelete = async (sale: Sale) => {
    if (role !== 'admin') return;

    const result = await deleteSale(sale.id, sale.productId, sale.quantity);

    if (result.success) {
      toast({ variant: 'destructive', title: 'Sale Deleted', description: result.message });
      await refetchSales();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.message });
    }
  };

  const isLoading = salesLoading || productsLoading || (role === 'admin' && usersLoading);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Sales History</CardTitle>
          <CardDescription>A log of all your recorded sales transactions.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                  <TableHead>Date</TableHead>
                  {role === 'admin' && <TableHead>Sales Agent</TableHead>}
                  {role === 'admin' && <TableHead className="w-[100px]">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-6 w-32"/></TableCell>
                    <TableCell><Skeleton className="h-6 w-16 ml-auto"/></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 ml-auto"/></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 ml-auto"/></TableCell>
                    <TableCell><Skeleton className="h-6 w-40"/></TableCell>
                    {role === 'admin' && <TableCell><Skeleton className="h-6 w-32"/></TableCell>}
                    {role === 'admin' && <TableCell><div className="flex gap-2 justify-end"><Skeleton className="h-8 w-8" /><Skeleton className="h-8 w-8" /></div></TableCell>}
                  </TableRow>
                ))}
                {sales && sales.map((sale) => {
                  const product = productsMap.get(sale.productId);
                  const agent = usersMap.get(sale.salesAgentId);
                  return (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">{product?.name || sale.productId}</TableCell>
                      <TableCell className="text-right">{sale.quantity}</TableCell>
                      <TableCell className="text-right text-green-600">{formatCurrency(sale.totalRevenue)}</TableCell>
                      <TableCell className="text-right text-blue-600">{formatCurrency(sale.profit)}</TableCell>
                      <TableCell>{formatDate(sale.saleDate)}</TableCell>
                      {role === 'admin' && (
                        <TableCell>
                          {agent ? `${agent.firstName} ${agent.lastName}` : 'Unknown'}
                        </TableCell>
                      )}
                      {role === 'admin' && (
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(sale)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(sale)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            {(!sales || sales.length === 0) && !isLoading && (
              <div className="text-center p-8 text-muted-foreground">No sales recorded yet.</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Sale Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Sale</DialogTitle>
            <DialogDescription>
              Update the quantity for this sale. Revenue and profit will be recalculated automatically.
            </DialogDescription>
          </DialogHeader>
          {editingSale && (
            <form onSubmit={handleEditSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="product" className="text-right">Product</Label>
                  <Input
                    id="product"
                    value={productsMap.get(editingSale.productId)?.name || 'Unknown'}
                    className="col-span-3"
                    disabled
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="quantity" className="text-right">Quantity</Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    min="1"
                    defaultValue={editingSale.quantity}
                    className="col-span-3"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary">Cancel</Button>
                </DialogClose>
                <Button type="submit" className="bg-accent hover:bg-accent/90">Save Changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
