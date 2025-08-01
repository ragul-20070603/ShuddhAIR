'use server';
/**
 * @fileOverview An AI agent that generates tips to reduce air pollution.
 *
 * - generatePollutionReductionTips - A function that generates pollution reduction tips.
 * - GeneratePollutionReductionTipsInput - The input type for the function.
 * - GeneratePollutionReductionTipsOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePollutionReductionTipsInputSchema = z.object({
  location: z.string().describe('The location (city) of the user.'),
  aqi: z.number().describe('The current Air Quality Index for the user\'s location.'),
  pollutants: z.string().describe('The list of main pollutants in the air.'),
});
export type GeneratePollutionReductionTipsInput = z.infer<typeof GeneratePollutionReductionTipsInputSchema>;

const GeneratePollutionReductionTipsOutputSchema = z.object({
  tips: z.string().describe('Actionable tips to help reduce air pollution in the specified area and maintain good AQI. The tips should be formatted as a list.'),
});
export type GeneratePollutionReductionTipsOutput = z.infer<typeof GeneratePollutionReductionTipsOutputSchema>;

export async function generatePollutionReductionTips(
  input: GeneratePollutionReductionTipsInput
): Promise<GeneratePollutionReductionTipsOutput> {
  return generatePollutionReductionTipsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePollutionReductionTipsPrompt',
  input: {schema: GeneratePollutionReductionTipsInputSchema},
  output: {schema: GeneratePollutionReductionTipsOutputSchema},
  prompt: `You are an environmental expert specializing in air quality management.

  Based on the user's location and current air quality conditions, provide a list of actionable tips to help reduce air pollution in their area and maintain a good AQI.

  The tips should be practical and divided into two categories:
  1.  **Community Actions**: Things the community can do together (e.g., promoting public transport, organizing tree-planting drives, advocating for stricter emission norms).
  2.  **Personal Actions**: Things an individual can do (e.g., reducing personal vehicle use, conserving energy, avoiding burning waste, using air purifiers).

  User Location: {{{location}}}
  Current AQI: {{{aqi}}}
  Main Pollutants: {{{pollutants}}}

  Please provide a response that is helpful and encouraging. Format the output as a markdown list.
  `,
});

const generatePollutionReductionTipsFlow = ai.defineFlow(
  {
    name: 'generatePollutionReductionTipsFlow',
    inputSchema: GeneratePollutionReductionTipsInputSchema,
    outputSchema: GeneratePollutionReductionTipsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
