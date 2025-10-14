'use client';

import * as React from 'react';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Sale } from '@/lib/types';
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
import { useCollection as useProductsCollection } from '@/firebase/firestore/use-collection';
import { Product } from '@/lib/types';


export default function SalesHistory() {
  const { user } = useUser();
  const firestore = useFirestore();

  const salesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, 'users', user.uid, 'sales'), orderBy('saleDate', 'desc'));
  }, [user, firestore]);
  const { data: sales, isLoading: salesLoading } = useCollection<Omit<Sale, 'id'>>(salesQuery);

  const productsCollection = useMemoFirebase(() => collection(firestore, 'products'), [firestore]);
  const { data: products, isLoading: productsLoading } = useProductsCollection<Omit<Product, 'id'>>(productsCollection);

  const productsMap = React.useMemo(() => {
    if (!products) return new Map();
    return new Map(products.map(p => [p.id, p]));
  }, [products]);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  
  const formatDate = (date: any) => {
    if (!date) return '';
    const jsDate = date.toDate ? date.toDate() : new Date(date);
    return format(jsDate, 'PPpp');
  }

  const isLoading = salesLoading || productsLoading;

  return (
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
                </TableRow>
              ))}
              {sales && sales.map((sale) => {
                const product = productsMap.get(sale.productId);
                return (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">{product?.name || sale.productId}</TableCell>
                    <TableCell className="text-right">{sale.quantity}</TableCell>
                    <TableCell className="text-right text-green-600">{formatCurrency(sale.totalRevenue)}</TableCell>
                    <TableCell className="text-right text-blue-600">{formatCurrency(sale.profit)}</TableCell>
                    <TableCell>{formatDate(sale.saleDate)}</TableCell>
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
  );
}
