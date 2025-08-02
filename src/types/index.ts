import { z } from 'zod';

export const healthFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  age: z.coerce.number().min(0).max(120),
  location: z.string().min(2, { message: "Location is required." }),
  healthConditions: z.string().optional(),
  languagePreference: z.enum(['en', 'ta', 'hi', 'bn', 'te', 'mr']),
  healthReport: z.string().optional(),
});

export type HealthFormSchema = z.infer<typeof healthFormSchema>;

export type Pollutant = {
  name: string;
  value: number;
  unit: string;
};

export type DailyForecast = {
  date: string;
  aqi: number;
  pollutants: Pollutant[];
};

export type AdvisoryResult = {
  current: {
    aqi: number;
    aqiCategory: string;
    pollutants: Pollutant[];
    weather: {
      temp: number;
      humidity: number;
      wind: number;
    };
  };
  forecast: DailyForecast[];
  modelForecast: DailyForecast[];
  advisory: string;
  location: {
    city: string;
    lat: number;
    lon: number;
  },
  user: {
    name: string;
  }
};

export type ChatMessage = {
    from: 'user' | 'bot';
    text: string;
};

export type NewsItem = {
    title: string;
    snippet: string;
    link: string;
    source: string;
};
