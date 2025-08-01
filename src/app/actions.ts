'use server';

import { z } from 'zod';
import { geocodeCity } from '@/ai/flows/geocode-city';
import { generateHealthAdvisory } from '@/ai/flows/generate-health-advisory';
import { getAirQualityData } from '@/services/air-quality';
import type { AdvisoryResult, HealthFormSchema, Pollutant } from '@/types';

const getAqiCategory = (aqi: number): { category: string; color: string } => {
  if (aqi <= 50) return { category: 'Good', color: 'text-green-500' };
  if (aqi <= 100) return { category: 'Moderate', color: 'text-yellow-500' };
  if (aqi <= 150) return { category: 'Unhealthy for Sensitive Groups', color: 'text-orange-500' };
  if (aqi <= 200) return { category: 'Unhealthy', color: 'text-red-500' };
  if (aqi <= 300) return { category: 'Very Unhealthy', color: 'text-purple-500' };
  return { category: 'Hazardous', color: 'text-maroon-500' };
};

const healthFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  age: z.coerce.number().min(0).max(120),
  location: z.string().min(2, { message: "Location is required." }),
  healthConditions: z.string().optional(),
  languagePreference: z.enum(['en', 'ta', 'hi']),
});


export async function getHealthAdvisoryAction(
  data: z.infer<typeof healthFormSchema>
): Promise<{ data: AdvisoryResult | null; error: string | null }> {
  const validation = healthFormSchema.safeParse(data);
  if (!validation.success) {
    return { data: null, error: validation.error.errors.map(e => e.message).join(', ') };
  }

  const { name, age, location, healthConditions, languagePreference } = validation.data;

  try {
    const geocodeResult = await geocodeCity({ city: location });
    const { latitude, longitude } = geocodeResult;
    
    const airQualityData = await getAirQualityData(latitude, longitude);

    if (!airQualityData.current) {
       return { data: null, error: 'Could not fetch current air quality data for the specified location. Please try another city.' };
    }

    const pollutantsString = airQualityData.current.pollutants.map(p => `${p.name}: ${p.value} ${p.unit}`).join(', ');

    const advisoryInput = {
      name,
      age,
      location,
      healthConditions: healthConditions || 'None',
      languagePreference,
      aqi: airQualityData.current.aqi,
      pollutants: pollutantsString,
    };

    const advisoryResult = await generateHealthAdvisory(advisoryInput);
    
    const result: AdvisoryResult = {
      ...airQualityData,
      advisory: advisoryResult.healthAdvisory,
      location: {
        city: location,
        lat: latitude,
        lon: longitude,
      },
      user: {
        name
      }
    };

    return { data: result, error: null };
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : 'Failed to generate health advisory. The location might not be recognized or an AI service error occurred.';

    if (message.includes('fetch failed')) {
        return { data: null, error: 'Failed to fetch air quality data. Please check your API keys in the .env.local file and ensure they are valid.' };
    }
    
    return { data: null, error: message };
  }
}
