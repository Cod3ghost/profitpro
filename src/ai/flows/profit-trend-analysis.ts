'use server';

/**
 * @fileOverview This file defines a Genkit flow for analyzing profit trends using historical sales data.
 *
 * The flow uses a prompt to instruct the LLM to identify key performance indicators and provide insights.
 * @param {string} salesData - Historical sales data in JSON format.
 * @returns {Promise<string>} - A promise that resolves to a string containing the analysis of profit trends.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProfitTrendAnalysisInputSchema = z.object({
  salesData: z.string().describe('Historical sales data in JSON format.'),
});
export type ProfitTrendAnalysisInput = z.infer<typeof ProfitTrendAnalysisInputSchema>;

const ProfitTrendAnalysisOutputSchema = z.string().describe('Analysis of profit trends.');
export type ProfitTrendAnalysisOutput = z.infer<typeof ProfitTrendAnalysisOutputSchema>;

/**
 * Analyzes historical sales data to identify profit trends using AI.
 * @param {ProfitTrendAnalysisInput} input - An object containing the sales data.
 * @returns {Promise<ProfitTrendAnalysisOutput>} - A promise that resolves to a string containing the analysis of profit trends.
 */
export async function analyzeProfitTrends(input: ProfitTrendAnalysisInput): Promise<ProfitTrendAnalysisOutput> {
  return profitTrendAnalysisFlow(input);
}

const profitTrendAnalysisPrompt = ai.definePrompt({
  name: 'profitTrendAnalysisPrompt',
  input: {schema: ProfitTrendAnalysisInputSchema},
  output: {schema: ProfitTrendAnalysisOutputSchema},
  prompt: `You are an expert business analyst.

  Analyze the following sales data to identify key profit trends and performance indicators.
  Provide a concise summary of your findings, highlighting any significant patterns or insights.
  Sales Data: {{{salesData}}}`,
});

const profitTrendAnalysisFlow = ai.defineFlow(
  {
    name: 'profitTrendAnalysisFlow',
    inputSchema: ProfitTrendAnalysisInputSchema,
    outputSchema: ProfitTrendAnalysisOutputSchema,
  },
  async input => {
    const {output} = await profitTrendAnalysisPrompt(input);
    return output!;
  }
);
