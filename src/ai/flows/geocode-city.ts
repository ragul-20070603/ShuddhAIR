// src/ai/flows/geocode-city.ts
'use server';
/**
 * @fileOverview A flow that converts a city name to geographical coordinates using the Gemini API.
 *
 * - geocodeCity - A function that handles the geocoding process.
 * - GeocodeCityInput - The input type for the geocodeCity function.
 * - GeocodeCityOutput - The return type for the geocodeCity function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeocodeCityInputSchema = z.object({
  city: z.string().describe('The name of the city to geocode.'),
});
export type GeocodeCityInput = z.infer<typeof GeocodeCityInputSchema>;

const GeocodeCityOutputSchema = z.object({
  latitude: z.number().describe('The latitude of the city.'),
  longitude: z.number().describe('The longitude of the city.'),
});
export type GeocodeCityOutput = z.infer<typeof GeocodeCityOutputSchema>;

export async function geocodeCity(input: GeocodeCityInput): Promise<GeocodeCityOutput> {
  return geocodeCityFlow(input);
}

const prompt = ai.definePrompt({
  name: 'geocodeCityPrompt',
  input: {schema: GeocodeCityInputSchema},
  output: {schema: GeocodeCityOutputSchema},
  prompt: `You are a geocoding expert. Given a city name, you will return its latitude and longitude.

City: {{{city}}}

Please respond with valid JSON in the following format: { \"latitude\": <latitude>, \"longitude\": <longitude> }`,
});

const geocodeCityFlow = ai.defineFlow(
  {
    name: 'geocodeCityFlow',
    inputSchema: GeocodeCityInputSchema,
    outputSchema: GeocodeCityOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
