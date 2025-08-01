import { addDays, format, fromUnixTime } from 'date-fns';
import type { Pollutant, DailyForecast, AdvisoryResult } from '@/types';

const AQICN_API_KEY = process.env.NEXT_PUBLIC_AQICN_API_KEY;
const OPENWEATHERMAP_API_KEY = process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY;

// Map pollutant names from OpenWeather to standard names and units
const pollutantNameMap: Record<string, { name: string; unit: string }> = {
    pm2_5: { name: 'PM2.5', unit: 'µg/m³' },
    pm10: { name: 'PM10', unit: 'µg/m³' },
    o3: { name: 'O₃', unit: 'µg/m³' },
    no2: { name: 'NO₂', unit: 'µg/m³' },
    so2: { name: 'SO₂', unit: 'µg/m³' },
    co: { name: 'CO', unit: 'µg/m³' },
};

const getAqiCategory = (aqi: number): string => {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
};

const owmToAqi = (level: number): number => {
    switch (level) {
        case 1: return 25; // Good
        case 2: return 75; // Fair -> Moderate
        case 3: return 125; // Moderate -> Unhealthy for Sensitive
        case 4: return 175; // Poor -> Unhealthy
        case 5: return 250; // Very Poor -> Very Unhealthy
        default: return 0;
    }
}

async function fetchCurrentAqi(lat: number, lon: number) {
    if (!AQICN_API_KEY || AQICN_API_KEY === "YOUR_AQICN_API_KEY") {
        console.warn("AQICN_API_KEY is not set. Using mock data for current conditions.");
        const mockAqi = Math.floor(Math.random() * 250) + 1;
        return {
            aqi: mockAqi,
            pollutants: [
                { name: 'PM2.5', value: parseFloat((mockAqi/2).toFixed(2)), unit: 'µg/m³' },
                { name: 'O₃', value: parseFloat((mockAqi/4).toFixed(2)), unit: 'µg/m³' },
            ]
        };
    }
    const url = `https://api.waqi.info/feed/geo:${lat};${lon}/?token=${AQICN_API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch from AQICN: ${response.statusText}`);
    }
    const data = await response.json();

    if (data.status !== 'ok') {
        throw new Error(`AQICN API error: ${data.data}`);
    }

    const aqi = data.data.aqi;
    const pollutants: Pollutant[] = Object.entries(data.data.iaqi)
        .map(([key, value]: [string, any]) => {
            const pollutantInfo = pollutantNameMap[key];
            if (pollutantInfo) {
                return {
                    name: pollutantInfo.name,
                    value: value.v,
                    unit: pollutantInfo.unit
                };
            }
            return null;
        })
        .filter((p): p is Pollutant => p !== null);

    return { aqi, pollutants };
}

async function fetchForecast(lat: number, lon: number): Promise<DailyForecast[]> {
     if (!OPENWEATHERMAP_API_KEY || OPENWEATHERMAP_API_KEY === "YOUR_OPENWEATHERMAP_API_KEY") {
        console.warn("OPENWEATHERMAP_API_KEY is not set. Using mock data for forecast.");
        const forecast: DailyForecast[] = [];
        const today = new Date();
        const baseAqi = Math.floor(Math.random() * 150) + 50;
        for (let i = 1; i <= 5; i++) {
            const date = addDays(today, i);
            const aqi = Math.round(baseAqi + (Math.random() - 0.5) * 40);
            forecast.push({
                date: format(date, 'EEE, MMM d'),
                aqi: Math.max(0, aqi),
                pollutants: [{ name: 'PM2.5', value: parseFloat((aqi/2).toFixed(2)), unit: 'µg/m³' }],
            });
        }
        return forecast;
    }

    const url = `https://api.openweathermap.org/data/2.5/air_pollution/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHERMAP_API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch from OpenWeatherMap: ${response.statusText}`);
    }
    const data = await response.json();

    const dailyData: { [key: string]: { aqis: number[]; pollutants: { [name: string]: number[] } } } = {};

    for (const item of data.list) {
        const date = format(fromUnixTime(item.dt), 'yyyy-MM-dd');
        if (!dailyData[date]) {
            dailyData[date] = { aqis: [], pollutants: {} };
        }
        dailyData[date].aqis.push(owmToAqi(item.main.aqi));
        for (const [key, value] of Object.entries(item.components)) {
             const pollutantInfo = pollutantNameMap[key];
             if(pollutantInfo) {
                if(!dailyData[date].pollutants[pollutantInfo.name]){
                    dailyData[date].pollutants[pollutantInfo.name] = [];
                }
                dailyData[date].pollutants[pollutantInfo.name].push(value as number);
             }
        }
    }

    return Object.entries(dailyData).map(([dateStr, values]) => {
        const avgAqi = Math.round(values.aqis.reduce((a, b) => a + b, 0) / values.aqis.length);
        
        const avgPollutants: Pollutant[] = Object.entries(values.pollutants).map(([name, pollValues]) => {
             const avgValue = pollValues.reduce((a,b) => a + b, 0) / pollValues.length;
             const unit = Object.values(pollutantNameMap).find(p => p.name === name)?.unit || 'µg/m³';
             return { name, value: parseFloat(avgValue.toFixed(2)), unit };
        });

        return {
            date: format(new Date(dateStr), 'EEE, MMM d'),
            aqi: avgAqi,
            pollutants: avgPollutants,
        };
    }).slice(0, 5); // Return today + next 4 days, then filter out today later.
}


export async function getAirQualityData(lat: number, lon: number): Promise<Omit<AdvisoryResult, 'advisory' | 'location' | 'user'>> {
    try {
        const [currentData, forecastData] = await Promise.all([
            fetchCurrentAqi(lat, lon),
            fetchForecast(lat, lon),
        ]);

        const todayStr = format(new Date(), 'EEE, MMM d');
        const fiveDayForecast = forecastData.filter(d => d.date !== todayStr).slice(0, 5);
        
        // Mock weather as OpenWeatherMap requires another call / subscription
        const weather = {
            temp: Math.floor(Math.random() * 20) + 15, // 15-35 C
            humidity: Math.floor(Math.random() * 50) + 40, // 40-90%
            wind: Math.floor(Math.random() * 15) + 5, // 5-20 km/h
        };

        return {
            current: {
                aqi: currentData.aqi,
                aqiCategory: getAqiCategory(currentData.aqi),
                pollutants: currentData.pollutants,
                weather,
            },
            forecast: fiveDayForecast,
        };
    } catch (error) {
        console.error("Error fetching air quality data:", error);
        throw error;
    }
}
