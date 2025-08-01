'use server';
/**
 * @fileOverview An AI agent that generates a title for a news snippet.
 *
 * - generateNewsTitle - A function that generates a news title.
 * - GenerateNewsTitleInput - The input type for the function.
 * - GenerateNewsTitleOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateNewsTitleInputSchema = z.object({
  snippet: z.string().describe('The news snippet to generate a title for.'),
});
export type GenerateNewsTitleInput = z.infer<typeof GenerateNewsTitleInputSchema>;

const GenerateNewsTitleOutputSchema = z.object({
  title: z.string().describe('A concise and relevant title based on the snippet.'),
});
export type GenerateNewsTitleOutput = z.infer<typeof GenerateNewsTitleOutputSchema>;

export async function generateNewsTitle(
  input: GenerateNewsTitleInput
): Promise<GenerateNewsTitleOutput> {
  return generateNewsTitleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateNewsTitlePrompt',
  input: {schema: GenerateNewsTitleInputSchema},
  output: {schema: GenerateNewsTitleOutputSchema},
  prompt: `Based on the following news snippet, generate a concise and relevant title of 5 to 10 words.

Snippet: {{{snippet}}}

Please generate a suitable title.
  `,
});

const generateNewsTitleFlow = ai.defineFlow(
  {
    name: 'generateNewsTitleFlow',
    inputSchema: GenerateNewsTitleInputSchema,
    outputSchema: GenerateNewsTitleOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
