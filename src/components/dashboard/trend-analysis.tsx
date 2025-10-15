'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Wand2 } from 'lucide-react';
import { getProfitTrendAnalysis } from '@/lib/actions';
import type { Sale } from '@/lib/types';
import { useToast } from "@/hooks/use-toast"

type TrendAnalysisProps = {
  salesData: Sale[];
};

export default function TrendAnalysis({ salesData }: TrendAnalysisProps) {
  const [analysis, setAnalysis] = React.useState<string>('');
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const { toast } = useToast();

  const handleAnalysis = async () => {
    setIsLoading(true);
    setAnalysis('');
    try {
      const result = await getProfitTrendAnalysis(salesData);
      setAnalysis(result);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: "Could not generate profit trend analysis.",
      })
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Trend Analysis</CardTitle>
        <CardDescription>Use AI to get insights on your profit trends.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 h-[calc(100%-5rem)]">
        <Button onClick={handleAnalysis} disabled={isLoading} className="w-full bg-accent hover:bg-accent/90 flex-shrink-0">
          <Wand2 className="mr-2 h-4 w-4" />
          {isLoading ? 'Analyzing...' : 'Analyze Profit Trends'}
        </Button>
        <div className="flex-1 rounded-lg border bg-muted/30 p-4 text-sm overflow-y-auto max-h-[300px]">
          {isLoading && (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          )}
          {analysis && <p className="whitespace-pre-wrap">{analysis}</p>}
          {!isLoading && !analysis && (
            <p className="text-muted-foreground text-center pt-8">Click the button to generate an analysis of your sales data.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
