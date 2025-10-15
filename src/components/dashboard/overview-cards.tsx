'use client';

import type { Sale } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, ShoppingCart, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';

type OverviewCardsProps = {
  salesData: Sale[];
};

export default function OverviewCards({ salesData }: OverviewCardsProps) {
  const { totalRevenue, totalProfit, totalSales } = useMemo(() => {
    const totalRevenue = salesData.reduce((acc, sale) => acc + sale.totalRevenue, 0);
    const totalProfit = salesData.reduce((acc, sale) => acc + sale.profit, 0);
    const totalSales = salesData.length;
    return { totalRevenue, totalProfit, totalSales };
  }, [salesData]);


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const overviewData = [
    {
      title: 'Total Revenue',
      value: formatCurrency(totalRevenue),
      icon: DollarSign,
      description: 'Total revenue from all sales.',
    },
    {
      title: 'Total Profit',
      value: formatCurrency(totalProfit),
      icon: TrendingUp,
      description: 'Total profit after costs.',
    },
    {
      title: 'Total Sales',
      value: totalSales.toLocaleString(),
      icon: ShoppingCart,
      description: 'Total number of sales transactions.',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {overviewData.map((item) => (
        <Card key={item.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
            <item.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{item.value}</div>
            <p className="text-xs text-muted-foreground">{item.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
