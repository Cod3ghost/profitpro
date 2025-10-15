'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { format, startOfMonth } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { Sale } from '@/lib/types';

type SalesChartProps = {
  salesData: Sale[];
};

export default function SalesChart({ salesData }: SalesChartProps) {
  const monthlyData = salesData.reduce((acc, sale) => {
    const saleDate = sale.saleDate instanceof Object && 'toDate' in sale.saleDate ? sale.saleDate.toDate() : new Date(sale.saleDate);
    const month = format(startOfMonth(saleDate), 'MMM yyyy');
    if (!acc[month]) {
      acc[month] = { month, revenue: 0, profit: 0 };
    }
    acc[month].revenue += sale.totalRevenue;
    acc[month].profit += sale.profit;
    return acc;
  }, {} as Record<string, { month: string; revenue: number; profit: number }>);

  const chartData = Object.values(monthlyData)
    .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

  const formatCurrency = (value: number) => {
    if (value >= 1000) return `₦${(value / 1000).toFixed(0)}k`;
    return `₦${value}`;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales & Profit Trends</CardTitle>
        <CardDescription>A monthly overview of your revenue and profit.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData}>
            <XAxis
              dataKey="month"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatCurrency}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                borderColor: 'hsl(var(--border))',
                borderRadius: 'var(--radius)',
              }}
              cursor={{ fill: 'hsl(var(--muted))' }}
            />
            <Legend wrapperStyle={{fontSize: "14px"}}/>
            <Bar dataKey="revenue" fill="hsl(var(--accent))" name="Revenue" radius={[4, 4, 0, 0]} />
            <Bar dataKey="profit" fill="hsl(var(--primary))" name="Profit" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
