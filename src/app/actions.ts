
'use server';

import { z } from 'zod';
import { geocodeCity } from '@/ai/flows/geocode-city';
import { generateHealthAdvisory } from '@/ai/flows/generate-health-advisory';
import { getAirQualityData } from '@/services/air-quality';
import type { AdvisoryResult, NewsItem } from '@/types';
import { chat } from '@/ai/flows/chat';
import { generatePollutionReductionTips } from '@/ai/flows/generate-pollution-reduction-tips';
import { getNews } from '@/services/news';
import { summarizeNews } from '@/ai/flows/summarize-news';
import { reverseGeocode } from '@/ai/flows/reverse-geocode';
import { predictAqi } from '@/services/aqi-prediction';


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
  languagePreference: z.enum(['en', 'ta', 'hi', 'bn', 'te', 'mr']),
});


export async function getHealthAdvisoryAction(
  data: z.infer<typeof healthFormSchema>
): Promise<{ data: AdvisoryResult | null; error: string | null }> {
  const validation = healthFormSchema.safeParse(data);
  if (!validation.success) {
    return { data: null, error: validation.error.errors.map(e => e.message).join(', ') };
  }

  const { name, age, healthConditions, languagePreference, location } = validation.data;
  
  let latitude: number;
  let longitude: number;

  try {
    const geo = await geocodeCity({ city: location });
    latitude = geo.latitude;
    longitude = geo.longitude;
  } catch (error) {
    console.error(`Failed to geocode city "${location}". Defaulting to Hyderabad.`, error);
    // Default to Hyderabad if the city is not found
    latitude = 17.3850;
    longitude = 78.4867;
  }
    
  try {
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
    
    let advisoryResult;
    try {
        advisoryResult = await generateHealthAdvisory(advisoryInput);
    } catch(e) {
        console.error("Failed to generate health advisory:", e);
        advisoryResult = { healthAdvisory: 'The AI Health Advisory service is currently unavailable. Based on the current AQI, consider limiting outdoor activities if you are in a sensitive group. Those with respiratory conditions should be especially careful.' };
    }
    
    let modelForecast;
    try {
        modelForecast = await predictAqi({
            currentAqi: airQualityData.current.aqi,
            weather: airQualityData.current.weather,
            days: 5,
            historicalData: airQualityData.forecast,
        });
    } catch(e) {
        console.error("Failed to get AI forecast:", e);
        modelForecast = { predictions: [] };
    }
    
    const result: AdvisoryResult = {
      ...airQualityData,
      advisory: advisoryResult.healthAdvisory,
      modelForecast: modelForecast.predictions,
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
    // This top-level catch is for truly unexpected errors, like network failures with the AQI/Weather APIs.
    const message = error instanceof Error ? error.message : 'An unexpected error occurred while fetching air quality data.';
    
    if (message.includes('fetch failed')) {
        return { data: null, error: 'Failed to fetch air quality data. Please check your internet connection and API keys.' };
    }
    
    return { data: null, error: message };
  }
}

const chatSchema = z.object({
  message: z.string(),
});

export async function chatAction(
  data: z.infer<typeof chatSchema>
): Promise<{ data: { response: string } | null, error: string | null }> {
    const validation = chatSchema.safeParse(data);
    if (!validation.success) {
        return { data: null, error: validation.error.errors.map(e => e.message).join(', ') };
    }

    try {
        const result = await chat({ message: validation.data.message });
        return { data: result, error: null };
    } catch (error) {
        console.error("Chatbot error:", error);
        return { data: { response: "I'm sorry, the Health Assistant is currently unavailable. Please try again later." }, error: null };
    }
}

const tipsSchema = z.object({
    location: z.string(),
    aqi: z.number(),
    pollutants: z.string(),
});

export async function getPollutionReductionTipsAction(
    data: z.infer<typeof tipsSchema>
): Promise<{ data: { tips: string } | null, error: string | null }> {
    const validation = tipsSchema.safeParse(data);
    if (!validation.success) {
        return { data: null, error: validation.error.errors.map(e => e.message).join(', ') };
    }

    try {
        const result = await generatePollutionReductionTips(validation.data);
        return { data: result, error: null };
    } catch (error) {
        console.error("Get tips error:", error);
        return { data: { tips: "Could not generate AI-powered tips at the moment. \n\n**General advice:** To improve air quality, consider using public transport, conserving energy at home, and avoiding burning waste." }, error: null };
    }
}

const newsSchema = z.object({
    city: z.string(),
});

export async function getNewsAction(
    data: z.infer<typeof newsSchema>
): Promise<{ data: { newsItems: NewsItem[], summary: string } | null, error: string | null }> {
    const validation = newsSchema.safeParse(data);
    if (!validation.success) {
        return { data: null, error: validation.error.errors.map(e => e.message).join(', ') };
    }
    const { city } = validation.data;

    try {
        const newsItems = await getNews(city);
        
        if (newsItems.length === 0) {
            return { data: { newsItems: [], summary: 'No recent news found for this location.' }, error: null };
        }
        
        let summaryResult;
        try {
            summaryResult = await summarizeNews({
                newsItems: newsItems.map(item => ({
                    title: item.title,
                    snippet: item.snippet,
                    source: item.source,
                })),
                location: city,
            });
        } catch(e) {
            console.error("News summarization error:", e);
            summaryResult = { summary: 'The AI news summary is currently unavailable. Please browse the articles below for the latest updates.' };
        }

        return { data: { newsItems, summary: summaryResult.summary }, error: null };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch news.';
        console.error("News action error:", message);
        return { data: { newsItems: [], summary: "Could not fetch news at this time." }, error: null };
    }
}

const reverseGeocodeSchema = z.object({
    latitude: z.number(),
    longitude: z.number(),
});

export async function reverseGeocodeAction(
    data: z.infer<typeof reverseGeocodeSchema>
): Promise<{ data: { city: string } | null, error: string | null }> {
    const validation = reverseGeocodeSchema.safeParse(data);
    if (!validation.success) {
        return { data: null, error: validation.error.errors.map(e => e.message).join(', ') };
    }

    try {
        const result = await reverseGeocode(validation.data);
        return { data: result, error: null };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to get city from coordinates.';
        // Don't expose this error to the user, as the form can still be used by typing.
        console.error(message);
        return { data: null, error: "Could not automatically determine your city. Please type it manually." };
    }
}
