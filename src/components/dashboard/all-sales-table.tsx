'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format } from 'date-fns';
import { Skeleton } from '../ui/skeleton';
import { createClient } from '@/lib/supabase/client';
import type { Sale, Product, SalesAgent } from '@/lib/types';

type AllSalesTableProps = {
  salesData: Sale[];
};

export default function AllSalesTable({ salesData }: AllSalesTableProps) {
  const supabase = createClient();
  const [products, setProducts] = React.useState<Product[]>([]);
  const [users, setUsers] = React.useState<SalesAgent[]>([]);
  const [productsLoading, setProductsLoading] = React.useState(true);
  const [usersLoading, setUsersLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchProducts() {
      try {
        const { data, error } = await supabase.from('products').select('*');
        if (!error) {
          setProducts(data.map((p) => ({
            id: p.id,
            name: p.name,
            costPrice: p.cost_price,
            sellingPrice: p.selling_price,
            stock: p.stock,
            imageUrl: p.image_url,
            imageHint: p.image_hint,
          })) as Product[]);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setProductsLoading(false);
      }
    }
    fetchProducts();
  }, [supabase]);

  React.useEffect(() => {
    async function fetchUsers() {
      try {
        const { data, error } = await supabase.from('users').select('*');
        if (!error) {
          setUsers(data.map((u) => ({
            id: u.id,
            firstName: u.first_name,
            lastName: u.last_name,
            email: u.email,
          })) as SalesAgent[]);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setUsersLoading(false);
      }
    }
    fetchUsers();
  }, [supabase]);

  const productsMap = React.useMemo(() => new Map(products.map(p => [p.id, p])), [products]);
  const usersMap = React.useMemo(() => new Map(users.map(u => [u.id, u])), [users]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);

  const formatDate = (date: any) => {
    if (!date) return '';
    const jsDate = date instanceof Date ? date : new Date(date);
    return format(jsDate, 'PPpp');
  };

  const formatDateShort = (date: any) => {
    if (!date) return '';
    const jsDate = date instanceof Date ? date : new Date(date);
    return format(jsDate, 'dd MMM yy, HH:mm');
  };

  const isLoading = productsLoading || usersLoading;

  const sortedSales = React.useMemo(() =>
    [...salesData].sort((a, b) => {
      const dateA = a.saleDate instanceof Date ? a.saleDate : new Date(a.saleDate);
      const dateB = b.saleDate instanceof Date ? b.saleDate : new Date(b.saleDate);
      return dateB.getTime() - dateA.getTime();
    }),
    [salesData]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Sales Transactions</CardTitle>
        <CardDescription>A complete log of all sales recorded by every agent.</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Mobile card list */}
        <div className="flex flex-col gap-3 sm:hidden">
          {isLoading && Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border p-4 space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-28" />
              <div className="flex justify-between pt-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          ))}
          {!isLoading && sortedSales.map((sale) => {
            const product = productsMap.get(sale.productId);
            const agent = usersMap.get(sale.salesAgentId);
            return (
              <div key={sale.id} className="rounded-lg border p-4 space-y-1.5">
                <p className="font-semibold">{product?.name || 'N/A'}</p>
                <p className="text-xs text-muted-foreground">{formatDateShort(sale.saleDate)}</p>
                <div className="flex items-center gap-4 text-sm pt-0.5">
                  <span className="text-muted-foreground">Qty: <span className="font-medium text-foreground">{sale.quantity}</span></span>
                  <span className="text-green-600 font-medium">{formatCurrency(sale.totalRevenue)}</span>
                  <span className="text-blue-600 font-medium">{formatCurrency(sale.profit)}</span>
                </div>
                {agent && (
                  <p className="text-xs text-muted-foreground">{agent.firstName} {agent.lastName}</p>
                )}
              </div>
            );
          })}
          {sortedSales.length === 0 && !isLoading && (
            <div className="text-center py-8 text-muted-foreground">No sales recorded yet.</div>
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Sales Agent</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Profit</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-6 w-24"/></TableCell>
                  <TableCell><Skeleton className="h-6 w-32"/></TableCell>
                  <TableCell><Skeleton className="h-6 w-16 ml-auto"/></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 ml-auto"/></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 ml-auto"/></TableCell>
                  <TableCell><Skeleton className="h-6 w-40"/></TableCell>
                </TableRow>
              ))}
              {sortedSales.map((sale) => {
                const product = productsMap.get(sale.productId);
                const agent = usersMap.get(sale.salesAgentId);
                return (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">{product?.name || 'N/A'}</TableCell>
                    <TableCell>{agent ? `${agent.firstName} ${agent.lastName}` : 'Anonymous'}</TableCell>
                    <TableCell className="text-right">{sale.quantity}</TableCell>
                    <TableCell className="text-right text-green-600">{formatCurrency(sale.totalRevenue)}</TableCell>
                    <TableCell className="text-right text-blue-600">{formatCurrency(sale.profit)}</TableCell>
                    <TableCell>{formatDate(sale.saleDate)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {sortedSales.length === 0 && !isLoading && (
            <div className="text-center p-8 text-muted-foreground">No sales recorded yet.</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
