'use server';
/**
 * @fileOverview An AI agent that summarizes news articles related to air quality.
 *
 * - summarizeNews - A function that generates a summary of news articles.
 * - SummarizeNewsInput - The input type for the function.
 * - SummarizeNewsOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeNewsInputSchema = z.object({
  newsItems: z.array(z.object({
    title: z.string(),
    snippet: z.string(),
    source: z.string(),
  })).describe('A list of news items to be summarized.'),
  location: z.string().describe('The location for which the news is relevant.'),
});
export type SummarizeNewsInput = z.infer<typeof SummarizeNewsInputSchema>;

const SummarizeNewsOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the provided news items.'),
});
export type SummarizeNewsOutput = z.infer<typeof SummarizeNewsOutputSchema>;

export async function summarizeNews(
  input: SummarizeNewsInput
): Promise<SummarizeNewsOutput> {
  return summarizeNewsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeNewsPrompt',
  input: {schema: SummarizeNewsInputSchema},
  output: {schema: SummarizeNewsOutputSchema},
  prompt: `You are a news analyst specializing in environmental topics.

  Based on the following list of news articles and video titles for {{{location}}}, provide a concise summary of the current air quality situation. Highlight any significant events, trends, or official announcements. The summary should be a single paragraph.

  News Items:
  {{#each newsItems}}
  - [{{source}}]: {{{title}}} - {{{snippet}}}
  {{/each}}

  Please generate a helpful and informative summary.
  `,
});

const summarizeNewsFlow = ai.defineFlow(
  {
    name: 'summarizeNewsFlow',
    inputSchema: SummarizeNewsInputSchema,
    outputSchema: SummarizeNewsOutputSchema,
  },
  async input => {
    if (input.newsItems.length === 0) {
        return { summary: 'No recent news found for this location.' };
    }
    const {output} = await prompt(input);
    return output!;
  }
);
