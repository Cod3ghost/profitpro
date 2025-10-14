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
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query } from 'firebase/firestore';
import { useFirestore, useMemoFirebase } from '@/firebase';
import type { Sale, Product, SalesAgent } from '@/lib/types';

type AllSalesTableProps = {
  salesData: Sale[];
};

export default function AllSalesTable({ salesData }: AllSalesTableProps) {
  const firestore = useFirestore();

  const productsCollection = useMemoFirebase(() => collection(firestore, 'products'), [firestore]);
  const { data: products, isLoading: productsLoading } = useCollection<Omit<Product, 'id'>>(productsCollection);

  const usersCollection = useMemoFirebase(() => collection(firestore, 'users'), [firestore]);
  const { data: users, isLoading: usersLoading } = useCollection<Omit<SalesAgent, 'id'>>(usersCollection);

  const productsMap = React.useMemo(() => {
    if (!products) return new Map();
    return new Map(products.map(p => [p.id, p]));
  }, [products]);
  
  const usersMap = React.useMemo(() => {
    if (!users) return new Map();
    return new Map(users.map(u => [u.id, u]));
    }, [users]);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  
  const formatDate = (date: any) => {
    if (!date) return '';
    const jsDate = date.toDate ? date.toDate() : new Date(date);
    return format(jsDate, 'PPpp');
  }

  const isLoading = productsLoading || usersLoading;

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Sales Transactions</CardTitle>
        <CardDescription>A complete log of all sales recorded by every agent.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border">
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
              {salesData && salesData.sort((a, b) => (b.saleDate as any).toDate() - (a.saleDate as any).toDate()).map((sale) => {
                const product = productsMap.get(sale.productId);
                const agent = usersMap.get(sale.salesAgentId);
                return (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">{product?.name || 'N/A'}</TableCell>
                    <TableCell>{agent ? `${agent.firstName} ${agent.lastName}`: 'Anonymous'}</TableCell>
                    <TableCell className="text-right">{sale.quantity}</TableCell>
                    <TableCell className="text-right text-green-600">{formatCurrency(sale.totalRevenue)}</TableCell>
                    <TableCell className="text-right text-blue-600">{formatCurrency(sale.profit)}</TableCell>
                    <TableCell>{formatDate(sale.saleDate)}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          {(!salesData || salesData.length === 0) && !isLoading && (
            <div className="text-center p-8 text-muted-foreground">No sales recorded yet.</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
