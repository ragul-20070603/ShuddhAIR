'use server';

import { z } from 'zod';
import { geocodeCity } from '@/ai/flows/geocode-city';
import { generateHealthAdvisory } from '@/ai/flows/generate-health-advisory';
import type { AdvisoryResult, DailyForecast, Pollutant, HealthFormSchema } from '@/types';
import { addDays, format } from 'date-fns';

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

// Mock data generation
const mockPollutants = (baseAqi: number): Pollutant[] => {
  const factor = baseAqi / 100;
  return [
    { name: 'PM2.5', value: parseFloat((factor * 60).toFixed(2)), unit: 'µg/m³' },
    { name: 'PM10', value: parseFloat((factor * 90).toFixed(2)), unit: 'µg/m³' },
    { name: 'O₃', value: parseFloat((factor * 40).toFixed(2)), unit: 'ppb' },
    { name: 'NO₂', value: parseFloat((factor * 25).toFixed(2)), unit: 'ppb' },
    { name: 'SO₂', value: parseFloat((factor * 10).toFixed(2)), unit: 'ppb' },
    { name: 'CO', value: parseFloat((factor * 1.5).toFixed(2)), unit: 'ppm' },
  ];
};

const mockForecast = (baseAqi: number): DailyForecast[] => {
  const forecast: DailyForecast[] = [];
  const today = new Date();
  for (let i = 1; i <= 5; i++) {
    const date = addDays(today, i);
    const aqi = Math.round(baseAqi + (Math.random() - 0.5) * 40);
    forecast.push({
      date: format(date, 'EEE, MMM d'),
      aqi: Math.max(0, aqi),
      pollutants: mockPollutants(Math.max(0, aqi)),
    });
  }
  return forecast;
};

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
    
    // Mocked AQI and weather data
    const currentAqi = Math.floor(Math.random() * 250) + 1;
    const pollutants = mockPollutants(currentAqi);
    const forecast = mockForecast(currentAqi);
    const weather = {
        temp: Math.floor(Math.random() * 20) + 15, // 15-35 C
        humidity: Math.floor(Math.random() * 50) + 40, // 40-90%
        wind: Math.floor(Math.random() * 15) + 5, // 5-20 km/h
    };

    const advisoryInput = {
      name,
      age,
      location,
      healthConditions: healthConditions || 'None',
      languagePreference,
      aqi: currentAqi,
      pollutants: pollutants.map(p => `${p.name}: ${p.value} ${p.unit}`).join(', '),
    };

    const advisoryResult = await generateHealthAdvisory(advisoryInput);
    
    const result: AdvisoryResult = {
      current: {
        aqi: currentAqi,
        aqiCategory: getAqiCategory(currentAqi).category,
        pollutants,
        weather,
      },
      forecast,
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
    return { data: null, error: 'Failed to generate health advisory. The location might not be recognized or an AI service error occurred.' };
  }
}
