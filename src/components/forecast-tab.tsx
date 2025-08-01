'use client';

import type { AdvisoryResult } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from '@/lib/utils';
import {
  ChartContainer,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, LabelList, Tooltip } from 'recharts';
import { NewsFeed } from './news-feed';

const getAqiInfo = (aqi: number): { category: string; color: string; bgColor: string; progressColor: string; hex: string } => {
  if (aqi <= 50) return { category: 'Good', color: 'text-green-700 dark:text-green-300', bgColor: 'bg-green-100 dark:bg-green-900/50', progressColor: 'stroke-green-500', hex: '#22c55e' };
  if (aqi <= 100) return { category: 'Moderate', color: 'text-yellow-700 dark:text-yellow-300', bgColor: 'bg-yellow-100 dark:bg-yellow-900/50', progressColor: 'stroke-yellow-500', hex: '#eab308' };
  if (aqi <= 150) return { category: 'Unhealthy for Sensitive Groups', color: 'text-orange-700 dark:text-orange-300', bgColor: 'bg-orange-100 dark:bg-orange-900/50', progressColor: 'stroke-orange-500', hex: '#f97316' };
  if (aqi <= 200) return { category: 'Unhealthy', color: 'text-red-700 dark:text-red-300', bgColor: 'bg-red-100 dark:bg-red-900/50', progressColor: 'stroke-red-500', hex: '#ef4444' };
  if (aqi <= 300) return { category: 'Very Unhealthy', color: 'text-purple-700 dark:text-purple-300', bgColor: 'bg-purple-100 dark:bg-purple-900/50', progressColor: 'stroke-purple-500', hex: '#8b5cf6' };
  return { category: 'Hazardous', color: 'text-stone-700 dark:text-stone-300', bgColor: 'bg-stone-200 dark:bg-stone-800/50', progressColor: 'stroke-stone-500', hex: '#78716c' };
};

export function ForecastTab({ data }: { data: AdvisoryResult }) {
  const { forecast, location } = data;

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

  const CustomLabel = (props: any) => {
    const { x, y, width, value, payload } = props;
    if (!payload) return null;
    const { category } = payload;
    return (
      <text x={x + width / 2} y={y} dy={-4} fill="hsl(var(--foreground))" className="text-xs" textAnchor="middle">
        {category}
      </text>
    );
  };
  
  const CustomTooltip = ({ active, payload, label }: any) => {
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
  };

  return (
    <div className="space-y-8">
        <Card className="shadow-md">
            <CardHeader>
            <CardTitle>5-Day AQI Forecast</CardTitle>
            <CardDescription>Predicted air quality for {location.city} for the upcoming days.</CardDescription>
            </CardHeader>
            <CardContent>
            <ChartContainer config={chartConfig} className="w-full h-[250px]">
                <BarChart accessibilityLayer data={chartData} margin={{ top: 30, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                    dataKey="date"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    stroke="hsl(var(--foreground))"
                />
                <YAxis
                    domain={[0, 'dataMax + 50']}
                    allowDataOverflow
                    axisLine={false}
                    tickLine={false}
                    tickMargin={10}
                    stroke="hsl(var(--foreground))"
                />
                <Tooltip
                    cursor={false}
                    content={<CustomTooltip />}
                />
                <Bar dataKey="aqi" radius={8}>
                    <LabelList dataKey="category" position="top" content={<CustomLabel />} />
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                </Bar>
                </BarChart>
            </ChartContainer>
            </CardContent>
        </Card>
        <NewsFeed city={location.city} />
    </div>
  )
}
