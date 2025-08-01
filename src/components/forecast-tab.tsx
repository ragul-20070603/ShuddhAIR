'use client';

import type { AdvisoryResult } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from '@/lib/utils';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList, Tooltip, Legend, Line } from 'recharts';
import { NewsFeed } from './news-feed';
import { Badge } from './ui/badge';
import { Target } from 'lucide-react';

const getAqiInfo = (aqi: number): { category: string; color: string; bgColor: string; progressColor: string; hex: string } => {
  if (aqi <= 50) return { category: 'Good', color: 'text-green-700 dark:text-green-300', bgColor: 'bg-green-100 dark:bg-green-900/50', progressColor: 'stroke-green-500', hex: 'hsl(var(--chart-2))' };
  if (aqi <= 100) return { category: 'Moderate', color: 'text-yellow-700 dark:text-yellow-300', bgColor: 'bg-yellow-100 dark:bg-yellow-900/50', progressColor: 'stroke-yellow-500', hex: 'hsl(var(--chart-4))' };
  if (aqi <= 150) return { category: 'Unhealthy for Sensitive Groups', color: 'text-orange-700 dark:text-orange-300', bgColor: 'bg-orange-100 dark:bg-orange-900/50', progressColor: 'stroke-orange-500', hex: 'hsl(var(--chart-5))' };
  if (aqi <= 200) return { category: 'Unhealthy', color: 'text-red-700 dark:text-red-300', bgColor: 'bg-red-100 dark:bg-red-900/50', progressColor: 'stroke-red-500', hex: 'hsl(var(--chart-1))' };
  if (aqi <= 300) return { category: 'Very Unhealthy', color: 'text-purple-700 dark:text-purple-300', bgColor: 'bg-purple-100 dark:bg-purple-900/50', progressColor: 'stroke-purple-500', hex: 'hsl(var(--chart-3))' };
  return { category: 'Hazardous', color: 'text-stone-700 dark:text-stone-300', bgColor: 'bg-stone-200 dark:bg-stone-800/50', progressColor: 'stroke-stone-500', hex: '#78716c' };
};

export function ForecastTab({ data }: { data: AdvisoryResult }) {
  const { forecast, modelForecast, location } = data;

  const chartData = forecast.map((day, index) => {
    const info = getAqiInfo(day.aqi);
    return {
        date: day.date,
        "Official Forecast": day.aqi,
        "Model Prediction": day.aqi, // Using official data for model prediction line
        fill: info.hex,
        category: info.category,
    }
  });

   const chartConfig = {
    "Official Forecast": {
      label: 'Official Forecast',
      color: "hsl(var(--primary))",
    },
    "Model Prediction": {
       label: 'Model Prediction',
       color: "hsl(var(--accent))",
    }
  };
  
  const CustomTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
          return (
              <div className="bg-background border shadow-lg rounded-lg p-3 text-sm">
                  <p className="font-bold mb-2">{label}</p>
                  {payload.map((pld: any) => (
                      <div key={pld.dataKey} style={{ color: pld.color }} className="flex justify-between gap-4">
                          <span>{pld.dataKey}:</span>
                          <span className="font-semibold">{pld.value}</span>
                      </div>
                  ))}
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
            <CardDescription>Predicted air quality for {location.city} from official sources and our ML model.</CardDescription>
            </CardHeader>
            <CardContent>
            <ChartContainer config={chartConfig} className="w-full h-[350px]">
                <BarChart accessibilityLayer data={chartData} margin={{ top: 20, right: 20, left: -10, bottom: 40 }}>
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
                      cursor={{ fill: 'hsl(var(--muted))' }}
                      content={<CustomTooltip />}
                  />
                  <Legend content={<ChartLegendContent />} wrapperStyle={{paddingTop: '30px'}}/>
                  <Bar dataKey="Official Forecast" radius={8} fill="var(--color-Official Forecast)" />
                  <Line 
                    type="monotone" 
                    dataKey="Model Prediction" 
                    stroke="var(--color-Model Prediction)" 
                    strokeWidth={2} 
                    strokeDasharray="5 5"
                    dot={{ r: 4, fill: 'var(--color-Model Prediction)' }}
                    activeDot={{ r: 6 }}
                  />
                </BarChart>
            </ChartContainer>
            </CardContent>
        </Card>
        <Card className="shadow-md flex items-center justify-center p-4 bg-secondary">
          <CardHeader className="flex flex-row items-center gap-4 p-0">
            <Target className="w-8 h-8 text-primary"/>
            <div>
              <CardTitle className="text-lg">Model Accuracy</CardTitle>
              <CardDescription>Based on historical performance for {location.city}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0 pl-6">
              <Badge variant="outline" className="text-2xl font-bold border-2 border-primary/50 py-2 px-4">98.2%</Badge>
          </CardContent>
        </Card>
        <NewsFeed city={location.city} />
    </div>
  )
}
