'use server';
/**
 * @fileOverview A flow that converts geographic coordinates to a city name using the Gemini API.
 *
 * - reverseGeocode - A function that handles the reverse geocoding process.
 * - ReverseGeocodeInput - The input type for the reverseGeocode function.
 * - ReverseGeocodeOutput - The return type for the reverseGeocode function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ReverseGeocodeInputSchema = z.object({
  latitude: z.number().describe('The latitude of the location.'),
  longitude: z.number().describe('The longitude of the location.'),
});
export type ReverseGeocodeInput = z.infer<typeof ReverseGeocodeInputSchema>;

const ReverseGeocodeOutputSchema = z.object({
  city: z.string().describe('The name of the city.'),
});
export type ReverseGeocodeOutput = z.infer<typeof ReverseGeocodeOutputSchema>;

export async function reverseGeocode(input: ReverseGeocodeInput): Promise<ReverseGeocodeOutput> {
  return reverseGeocodeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'reverseGeocodePrompt',
  input: {schema: ReverseGeocodeInputSchema},
  output: {schema: ReverseGeocodeOutputSchema},
  prompt: `You are a reverse geocoding expert. Given a latitude and longitude, you will return the corresponding city name. Only return the city name.

Latitude: {{{latitude}}}
Longitude: {{{longitude}}}

Please respond with valid JSON in the following format: { "city": "<city_name>" }`,
});

const reverseGeocodeFlow = ai.defineFlow(
  {
    name: 'reverseGeocodeFlow',
    inputSchema: ReverseGeocodeInputSchema,
    outputSchema: ReverseGeocodeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
