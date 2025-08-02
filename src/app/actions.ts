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

const IS_DEMO_MODE = !process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.startsWith('AIzaSy');


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

  const { name, age, healthConditions, languagePreference } = validation.data;
  const location = "Hyderabad";

  try {
    const geocodeResult = IS_DEMO_MODE ? { latitude: 17.3850, longitude: 78.4867 } : await geocodeCity({ city: location });
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
    
    if (IS_DEMO_MODE) {
        const mockAdvisory = `Hello ${name}. Based on the current Air Quality Index (AQI) of ${airQualityData.current.aqi} in ${location}, which is considered 'Moderate', here are some health recommendations for you. Given your age of ${age}, it's generally okay to be outdoors. However, if you have any respiratory conditions like asthma, you may want to limit prolonged or heavy exertion.

Key recommendations:
- **Monitor Symptoms**: Pay attention to symptoms like coughing or shortness of breath.
- **Stay Hydrated**: Drink plenty of water throughout the day.
- **Reduce Exposure**: Consider wearing a mask if you are sensitive to pollutants and close windows during peak pollution hours.`;
        const result: AdvisoryResult = {
            ...airQualityData,
            advisory: mockAdvisory,
            modelForecast: (await predictAqi({ currentAqi: airQualityData.current.aqi, weather: airQualityData.current.weather, days: 5, historicalData: airQualityData.forecast })).predictions,
            location: { city: location, lat: latitude, lon: longitude, },
            user: { name }
        };
        return { data: result, error: null };
    }


    const [advisoryResult, modelForecast] = await Promise.all([
      generateHealthAdvisory(advisoryInput),
      predictAqi({
        currentAqi: airQualityData.current.aqi,
        weather: airQualityData.current.weather,
        days: 5,
        historicalData: airQualityData.forecast,
      })
    ]);
    
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
    const message = error instanceof Error ? error.message : 'Failed to generate health advisory. The location might not be recognized or an AI service error occurred.';

    if (message.includes('fetch failed')) {
        return { data: null, error: 'Failed to fetch air quality data. Please check your API keys in the .env.local file and ensure they are valid.' };
    }
    
    if(message.includes('API_KEY_SERVICE_BLOCKED') || message.includes('429')) {
        return { data: null, error: 'The API key is invalid or has exceeded its quota. Please enable billing on your Google Cloud project or provide a new key.' };
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
    if (IS_DEMO_MODE) {
        return { data: { response: "I can provide general information about air quality and its health effects. What would you like to know?" }, error: null };
    }
    const validation = chatSchema.safeParse(data);
    if (!validation.success) {
        return { data: null, error: validation.error.errors.map(e => e.message).join(', ') };
    }

    try {
        const result = await chat({ message: validation.data.message });
        return { data: result, error: null };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to get a response from the chatbot.';
        return { data: null, error: message };
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
    if (IS_DEMO_MODE) {
        return { data: { tips: "**Personal Actions:**\n- **Reduce Vehicle Use**: Opt for public transport, cycling, or walking whenever possible. Carpooling is another great option.\n- **Conserve Energy**: Turn off lights and appliances when not in use. Switch to energy-efficient LED bulbs.\n- **Avoid Burning Waste**: Never burn trash, leaves, or other materials, as it releases harmful pollutants.\n- **Use Eco-Friendly Products**: Choose household and cleaning products with low levels of volatile organic compounds (VOCs).\n\n**Community Actions:**\n- **Promote Green Spaces**: Participate in or organize tree-planting drives in your neighborhood.\n- **Advocate for Clean Energy**: Support policies that promote renewable energy sources like solar and wind.\n- **Community Cleanup Programs**: Organize events to clean up local areas, which can reduce airborne dust and waste." }, error: null };
    }
    const validation = tipsSchema.safeParse(data);
    if (!validation.success) {
        return { data: null, error: validation.error.errors.map(e => e.message).join(', ') };
    }

    try {
        const result = await generatePollutionReductionTips(validation.data);
        return { data: result, error: null };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to get a response from the chatbot.';
        return { data: null, error: message };
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
     const city = "Hyderabad";

    try {
        const newsItems = await getNews(city);

        if (newsItems.length === 0) {
            return { data: { newsItems: [], summary: 'No recent news found for this location.' }, error: null };
        }
        
        if (IS_DEMO_MODE) {
             return { data: { newsItems, summary: `Recent news in ${city} highlights ongoing efforts by local authorities to curb industrial emissions. A new policy introduces stricter standards for factories, while citizen-led initiatives are promoting the use of public transport to reduce vehicular pollution.` }, error: null };
        }

        const summaryResult = await summarizeNews({
            newsItems: newsItems.map(item => ({
                title: item.title,
                snippet: item.snippet,
                source: item.source,
            })),
            location: city,
        });

        return { data: { newsItems, summary: summaryResult.summary }, error: null };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch or summarize news.';
        console.error("News action error:", message);
        return { data: null, error: message };
    }
}

const reverseGeocodeSchema = z.object({
    latitude: z.number(),
    longitude: z.number(),
});

export async function reverseGeocodeAction(
    data: z.infer<typeof reverseGeocodeSchema>
): Promise<{ data: { city: string } | null, error: string | null }> {
    if (IS_DEMO_MODE) {
        return { data: { city: "Hyderabad" }, error: null };
    }
    const validation = reverseGeocodeSchema.safeParse(data);
    if (!validation.success) {
        return { data: null, error: validation.error.errors.map(e => e.message).join(', ') };
    }

    try {
        // Return Hyderabad regardless of coordinates
        return { data: { city: "Hyderabad" }, error: null };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to get city from coordinates.';
        return { data: null, error: message };
    }
}
