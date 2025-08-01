'use server';
/**
 * @fileOverview An AI agent that generates personalized health recommendations based on user input and AQI data.
 *
 * - generateHealthAdvisory - A function that generates health recommendations.
 * - GenerateHealthAdvisoryInput - The input type for the generateHealthAdvisory function.
 * - GenerateHealthAdvisoryOutput - The return type for the generateHealthAdvisory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateHealthAdvisoryInputSchema = z.object({
  name: z.string().describe('The name of the user.'),
  age: z.number().describe('The age of the user.'),
  location: z.string().describe('The location (city) of the user.'),
  healthConditions: z.string().describe('Any personal health conditions of the user.'),
  aqi: z.number().describe('The current Air Quality Index for the user\'s location.'),
  pollutants: z.string().describe('The list of pollutants in the air.'),
  languagePreference: z
    .string()
    .describe('The preferred language for the health advisory (en, ta, hi, bn, te, mr, etc.)'),
});
export type GenerateHealthAdvisoryInput = z.infer<typeof GenerateHealthAdvisoryInputSchema>;

const GenerateHealthAdvisoryOutputSchema = z.object({
  healthAdvisory: z.string().describe('Personalized health recommendations based on user data and AQI.'),
});
export type GenerateHealthAdvisoryOutput = z.infer<typeof GenerateHealthAdvisoryOutputSchema>;

export async function generateHealthAdvisory(
  input: GenerateHealthAdvisoryInput
): Promise<GenerateHealthAdvisoryOutput> {
  return generateHealthAdvisoryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateHealthAdvisoryPrompt',
  input: {schema: GenerateHealthAdvisoryInputSchema},
  output: {schema: GenerateHealthAdvisoryOutputSchema},
  prompt: `You are a health advisor specializing in air quality and its impact on health.

  Based on the user's personal information and the current air quality conditions, provide personalized health recommendations.
  Translate the advisory to the language specified by the user.

  User Information:
  - Name: {{{name}}}
  - Age: {{{age}}}
  - Location: {{{location}}}
  - Health Conditions: {{{healthConditions}}}
  - Language Preference: {{{languagePreference}}}

  Air Quality Information:
  - AQI: {{{aqi}}}
  - Pollutants: {{{pollutants}}}

  Provide a detailed and personalized health advisory, considering all the provided information. The health advisory MUST be in the language specified in Language Preference.
  `,
});

const generateHealthAdvisoryFlow = ai.defineFlow(
  {
    name: 'generateHealthAdvisoryFlow',
    inputSchema: GenerateHealthAdvisoryInputSchema,
    outputSchema: GenerateHealthAdvisoryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
