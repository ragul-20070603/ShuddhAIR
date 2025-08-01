'use client'

import type { AdvisoryResult, Pollutant } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Wind, Thermometer, Droplets, Bot, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const getAqiInfo = (aqi: number): { category: string; color: string; bgColor: string; progressColor: string } => {
  if (aqi <= 50) return { category: 'Good', color: 'text-green-700', bgColor: 'bg-green-100', progressColor: 'stroke-green-500' };
  if (aqi <= 100) return { category: 'Moderate', color: 'text-yellow-700', bgColor: 'bg-yellow-100', progressColor: 'stroke-yellow-500' };
  if (aqi <= 150) return { category: 'Unhealthy for Sensitive Groups', color: 'text-orange-700', bgColor: 'bg-orange-100', progressColor: 'stroke-orange-500' };
  if (aqi <= 200) return { category: 'Unhealthy', color: 'text-red-700', bgColor: 'bg-red-100', progressColor: 'stroke-red-500' };
  if (aqi <= 300) return { category: 'Very Unhealthy', color: 'text-purple-700', bgColor: 'bg-purple-100', progressColor: 'stroke-purple-500' };
  return { category: 'Hazardous', color: 'text-stone-700', bgColor: 'bg-stone-200', progressColor: 'stroke-stone-500' };
};

const AqiGauge = ({ aqi }: { aqi: number }) => {
  const { color, bgColor, progressColor } = getAqiInfo(aqi);
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

export function ResultsDisplay({ data }: { data: AdvisoryResult }) {
  const { current, forecast, advisory, location, user } = data;
  const aqiInfo = getAqiInfo(current.aqi);

  const chartData = forecast.map(day => ({
    date: day.date,
    aqi: day.aqi
  }));

  const chartConfig = {
    aqi: {
      label: 'AQI',
      color: 'hsl(var(--primary))',
    },
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight flex items-center justify-center gap-2">
            <MapPin className="text-primary"/>
            Air Quality Report for {location.city}
        </h2>
        <p className="text-muted-foreground">Personalized for {user.name}</p>
      </div>

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
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Bar dataKey="aqi" radius={8} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
