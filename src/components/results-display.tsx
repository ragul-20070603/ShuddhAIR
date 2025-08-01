'use client'

import { useState } from 'react';
import type { AdvisoryResult, Pollutant } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Wind, Thermometer, Droplets, Bot, MapPin, Sparkles, Loader2, Lightbulb, Activity, Newspaper } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from 'recharts';
import { getPollutionReductionTipsAction } from '@/app/actions';
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NewsFeed } from './news-feed';

const getAqiInfo = (aqi: number): { category: string; color: string; bgColor: string; progressColor: string; hex: string } => {
  if (aqi <= 50) return { category: 'Good', color: 'text-green-700', bgColor: 'bg-green-100', progressColor: 'stroke-green-500', hex: '#22c55e' };
  if (aqi <= 100) return { category: 'Moderate', color: 'text-yellow-700', bgColor: 'bg-yellow-100', progressColor: 'stroke-yellow-500', hex: '#eab308' };
  if (aqi <= 150) return { category: 'Unhealthy for Sensitive Groups', color: 'text-orange-700', bgColor: 'bg-orange-100', progressColor: 'stroke-orange-500', hex: '#f97316' };
  if (aqi <= 200) return { category: 'Unhealthy', color: 'text-red-700', bgColor: 'bg-red-100', progressColor: 'stroke-red-500', hex: '#ef4444' };
  if (aqi <= 300) return { category: 'Very Unhealthy', color: 'text-purple-700', bgColor: 'bg-purple-100', progressColor: 'stroke-purple-500', hex: '#8b5cf6' };
  return { category: 'Hazardous', color: 'text-stone-700', bgColor: 'bg-stone-200', progressColor: 'stroke-stone-500', hex: '#78716c' };
};

const AqiGauge = ({ aqi }: { aqi: number }) => {
  const { color, progressColor } = getAqiInfo(aqi);
  const circumference = 2 * Math.PI * 40; // r=40
  const aqiClamped = Math.min(aqi, 500);
  const strokeDashoffset = circumference - (aqiClamped / 500) * circumference;

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg className="w-48 h-48" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="none" className="stroke-slate-200" strokeWidth="10" />
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          className={cn("transition-all duration-1000 ease-out", progressColor)}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={cn("text-4xl font-bold", color)}>{aqi}</span>
        <span className="text-sm text-muted-foreground">AQI</span>
      </div>
    </div>
  );
};

const PollutantBadge = ({ pollutant }: { pollutant: Pollutant }) => {
    return (
        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border">
            <span className="text-sm font-medium text-slate-600">{pollutant.name}</span>
            <span className="text-sm font-bold">{pollutant.value} <span className="text-xs text-muted-foreground">{pollutant.unit}</span></span>
        </div>
    )
}

const AdvisoryTabContent = ({ data }: { data: AdvisoryResult }) => {
  const { current, forecast, advisory, location } = data;
  const aqiInfo = getAqiInfo(current.aqi);
  const [tips, setTips] = useState<string | null>(null);
  const [loadingTips, setLoadingTips] = useState(false);
  const { toast } = useToast();

  const chartData = forecast.map(day => {
    const info = getAqiInfo(day.aqi);
    return {
        date: day.date,
        aqi: day.aqi,
        fill: info.hex,
        category: info.category,
    }
  });

  const chartConfig = {
    aqi: {
      label: 'AQI',
    },
  };

  const handleGetTips = async () => {
    setLoadingTips(true);
    setTips(null);
    try {
        const pollutantsString = current.pollutants.map(p => p.name).join(', ');
        const res = await getPollutionReductionTipsAction({
            location: location.city,
            aqi: current.aqi,
            pollutants: pollutantsString
        });
        if (res.error) {
            throw new Error(res.error);
        }
        setTips(res.data?.tips || 'No tips available at this moment.');
    } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : "Could not fetch tips.";
        toast({
            variant: "destructive",
            title: "Error",
            description: errorMessage,
        });
    } finally {
        setLoadingTips(false);
    }
  }

  return (
    <div className="space-y-8 mt-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 flex flex-col items-center justify-center text-center shadow-md">
           <CardHeader>
             <CardTitle>Current Air Quality</CardTitle>
           </CardHeader>
           <CardContent>
            <AqiGauge aqi={current.aqi} />
            <Badge className={cn("mt-4 text-lg", aqiInfo.color, aqiInfo.bgColor)}>{aqiInfo.category}</Badge>
          </CardContent>
        </Card>
        
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-md">
                <CardHeader>
                    <CardTitle>Pollutants</CardTitle>
                    <CardDescription>Main components affecting air quality.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3">
                    {current.pollutants.map(p => <PollutantBadge key={p.name} pollutant={p}/>)}
                </CardContent>
            </Card>
            <Card className="shadow-md">
                <CardHeader>
                    <CardTitle>Weather Conditions</CardTitle>
                    <CardDescription>Current environmental factors.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-lg">
                    <div className="flex items-center gap-4"><Thermometer className="text-red-500"/> <span>{current.weather.temp}°C</span></div>
                    <div className="flex items-center gap-4"><Droplets className="text-blue-500"/> <span>{current.weather.humidity}% Humidity</span></div>
                    <div className="flex items-center gap-4"><Wind className="text-gray-500"/> <span>{current.weather.wind} km/h Wind</span></div>
                </CardContent>
            </Card>
        </div>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bot className="text-primary"/> AI Health Advisory</CardTitle>
          <CardDescription>Personalized recommendations based on your profile and current conditions.</CardDescription>
        </CardHeader>
        <CardContent className="prose prose-blue max-w-none text-base whitespace-pre-wrap">
          <p>{advisory}</p>
        </CardContent>
      </Card>
      
       <Card className="shadow-md">
        <CardHeader>
          <CardTitle>5-Day AQI Forecast</CardTitle>
          <CardDescription>Predicted air quality for the upcoming days.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="w-full h-[250px]">
            <BarChart accessibilityLayer data={chartData} margin={{ top: 20, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
              />
              <YAxis
                domain={[0, 'dataMax + 50']}
                allowDataOverflow
                axisLine={false}
                tickLine={false}
                tickMargin={10}
              />
              <ChartTooltip
                cursor={false}
                content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const { color } = getAqiInfo(data.aqi);
                        return (
                            <div className="bg-background border shadow-lg rounded-lg p-3">
                                <p className="font-semibold">{label}</p>
                                <p className={cn("font-bold", color)}>{`AQI: ${data.aqi}`}</p>
                                <p className="text-sm text-muted-foreground">{`Category: ${data.category}`}</p>
                            </div>
                        );
                    }
                    return null;
                }}
              />
              <Bar dataKey="aqi" radius={8}>
                {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="text-center">
        <Button onClick={handleGetTips} disabled={loadingTips}>
            {loadingTips ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Tips...
                </>
            ) : (
                <>
                    <Lightbulb className="mr-2 h-4 w-4" />
                    Get Tips to Improve Air Quality
                </>
            )}
        </Button>
      </div>

       {tips && (
        <Card className="shadow-md">
            <CardHeader>
            <CardTitle className="flex items-center gap-2"><Sparkles className="text-primary"/> Air Pollution Reduction Tips</CardTitle>
            <CardDescription>Actionable advice for a cleaner environment in {location.city}.</CardDescription>
            </CardHeader>
            <CardContent className="prose prose-blue max-w-none text-base whitespace-pre-wrap">
                <p>{tips}</p>
            </CardContent>
        </Card>
       )}
    </div>
  )
};


export function ResultsDisplay({ data }: { data: AdvisoryResult }) {
  const { location, user } = data;

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight flex items-center justify-center gap-2">
            <MapPin className="text-primary"/>
            Air Quality Report for {location.city}
        </h2>
        <p className="text-muted-foreground">Personalized for {user.name}</p>
      </div>

      <Tabs defaultValue="advisory" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="advisory">
            <Activity className="mr-2"/>
            Advisory
          </TabsTrigger>
          <TabsTrigger value="news">
            <Newspaper className="mr-2"/>
            News
          </TabsTrigger>
        </TabsList>
        <TabsContent value="advisory">
          <AdvisoryTabContent data={data} />
        </TabsContent>
        <TabsContent value="news">
           <NewsFeed city={location.city} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
