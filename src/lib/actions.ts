'use server';

import { analyzeProfitTrends } from '@/ai/flows/profit-trend-analysis';
import type { Sale } from '@/lib/types';

export async function getProfitTrendAnalysis(salesData: Sale[]): Promise<string> {
  if (!salesData || salesData.length === 0) {
    return 'No sales data available to analyze.';
  }

  try {
    const analysis = await analyzeProfitTrends({
      salesData: JSON.stringify(salesData, null, 2),
    });
    return analysis;
  } catch (error) {
    console.error('Error analyzing profit trends:', error);
    return 'An error occurred while analyzing profit trends. Please check the server logs and try again.';
  }
}
