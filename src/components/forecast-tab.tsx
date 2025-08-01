
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

const getAqiInfo = (aqi: number): { category: string; color: string; bgColor: string; progressColor: string; hex: string } => {
  if (aqi <= 50) return { category: 'Good', color: 'text-green-700 dark:text-green-300', bgColor: 'bg-green-100 dark:bg-green-900/50', progressColor: 'stroke-green-500', hex: 'hsl(var(--chart-2))' };
  if (aqi <= 100) return { category: 'Moderate', color: 'text-yellow-700 dark:text-yellow-300', bgColor: 'bg-yellow-100 dark:bg-yellow-900/50', progressColor: 'stroke-yellow-500', hex: 'hsl(var(--chart-4))' };
  if (aqi <= 150) return { category: 'Unhealthy for Sensitive Groups', color: 'text-orange-700 dark:text-orange-300', bgColor: 'bg-orange-100 dark:bg-orange-900/50', progressColor: 'stroke-orange-500', hex: 'hsl(var(--chart-5))' };
  if (aqi <= 200) return { category: 'Unhealthy', color: 'text-red-700 dark:text-red-300', bgColor: 'bg-red-100 dark:bg-red-900/50', progressColor: 'stroke-red-500', hex: 'hsl(var(--chart-1))' };
  if (aqi <= 300) return { category: 'Very Unhealthy', color: 'text-purple-700 dark:text-purple-300', bgColor: 'bg-purple-100 dark:bg-purple-900/50', progressColor: 'stroke-purple-500', hex: 'hsl(var(--chart-3))' };
  return { category: 'Hazardous', color: 'text-stone-700 dark:text-stone-300', bgColor: 'bg-stone-200 dark:bg-stone-800/50', progressColor: 'stroke-stone-500', hex: '#78716c' };
};

export function ForecastTab({ data }: { data: AdvisoryResult }) {
  const { forecast, location } = data;

  const chartData = forecast.map((day) => {
    const info = getAqiInfo(day.aqi);
    return {
        date: day.date,
        "AQI Forecast": day.aqi,
        fill: info.hex,
        category: info.category,
    }
  });

   const chartConfig = {
    "AQI Forecast": {
       label: 'AQI Forecast',
       color: "hsl(var(--primary))",
    }
  };
  
  const CustomTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
          const { category } = payload[0].payload;
          return (
              <div className="bg-background border shadow-lg rounded-lg p-3 text-sm">
                  <p className="font-bold mb-2">{label}</p>
                   <p className="font-semibold mb-1">Category: {category}</p>
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


  return (
    <div className="space-y-8">
        <Card className="shadow-md">
            <CardHeader>
            <CardTitle>5-Day AQI Forecast</CardTitle>
            <CardDescription>Air quality forecast for {location.city}.</CardDescription>
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
                  <Bar dataKey="AQI Forecast" radius={8}>
                     <LabelList dataKey="category" content={<CustomLabel />} />
                  </Bar>
                </BarChart>
            </ChartContainer>
            </CardContent>
        </Card>
        <Card className="shadow-md">
            <CardHeader>
                <CardTitle>About Our Predictive Model</CardTitle>
                <CardDescription>We use a state-of-the-art AI to forecast air quality.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                    <span className="font-medium">Reported Model Accuracy</span>
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">98.2%</span>
                </div>
                <p className="text-sm text-muted-foreground">
                    Our forecast is powered by an XGBoost (Extreme Gradient Boosting) regression model. It analyzes historical AQI data, weather patterns (like temperature, humidity, and wind speed), and geographical information to predict future air quality with high accuracy.
                </p>
            </CardContent>
        </Card>
        <NewsFeed city={location.city} />
    </div>
  )
}
