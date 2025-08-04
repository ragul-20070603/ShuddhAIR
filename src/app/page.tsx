
'use client';

import { useState, useEffect } from 'react';
import { HealthForm } from '@/components/health-form';
import { getHealthAdvisoryAction } from '@/app/actions';
import type { AdvisoryResult } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { Header } from '@/components/header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileInput, HomeIcon, BarChart3, User, Settings } from 'lucide-react';
import { HomeTab } from '@/components/home-tab';
import { ForecastTab } from '@/components/forecast-tab';
import { DashboardTab } from '@/components/dashboard-tab';
import { SettingsTab } from '@/components/settings-tab';
import { Card, CardContent } from '@/components/ui/card';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<AdvisoryResult | null>(null);
  const [activeTab, setActiveTab] = useState('input');
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleFormSubmit = async (data: any) => {
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const res = await getHealthAdvisoryAction(data);
      if (res.error) {
        throw new Error(res.error);
      }
      setResults(res.data);
      setActiveTab('home');
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred.";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
      setActiveTab('input');
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (!isClient) {
      return (
         <div className="flex-grow container mx-auto p-4 md:p-8 flex justify-center items-center">
            <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary"></div>
         </div>
      );
    }

    return (
        <main className="flex-grow container mx-auto p-4 md:p-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-5 mb-6">
                    <TabsTrigger value="input"><FileInput className="mr-2"/>Input</TabsTrigger>
                    <TabsTrigger value="home" disabled={!results}><HomeIcon className="mr-2"/>Home</TabsTrigger>
                    <TabsTrigger value="forecast" disabled={!results}><BarChart3 className="mr-2"/>Forecast & News</TabsTrigger>
                    <TabsTrigger value="dashboard" disabled={!results}><User className="mr-2"/>Dashboard</TabsTrigger>
                    <TabsTrigger value="settings"><Settings className="mr-2"/>Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="input">
                    <section className="space-y-4">
                        <div className="text-center">
                        <h2 className="text-3xl md:text-4xl font-bold font-headline tracking-tight">Your Personal Air Quality Advisor</h2>
                        <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
                            Enter your details to receive personalized health recommendations based on the current air quality in your area.
                        </p>
                        </div>

                        <div className="flex justify-center items-center">
                        <HealthForm onSubmit={handleFormSubmit} loading={loading} />
                        </div>
                        {loading && (
                            <div className="flex justify-center items-center p-8">
                                <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary"></div>
                            </div>
                        )}
                        {error && !loading && (
                            <div className="text-center text-red-500 bg-red-100 p-4 rounded-md">
                                <p><strong>Error:</strong> {error}</p>
                            </div>
                        )}
                    </section>
                </TabsContent>

                <TabsContent value="home">
                    {results ? <HomeTab data={results} /> : <TabPlaceholder text="Submit the form to see your home dashboard."/>}
                </TabsContent>

                <TabsContent value="forecast">
                    {results ? <ForecastTab data={results} /> : <TabPlaceholder text="Submit the form to see the forecast and news."/>}
                </TabsContent>

                <TabsContent value="dashboard">
                    {results ? <DashboardTab data={results} /> : <TabPlaceholder text="Submit the form to see your personal dashboard."/>}
                </TabsContent>

                <TabsContent value="settings">
                    <SettingsTab />
                </TabsContent>
            </Tabs>
        </main>
    );
  };


  return (
    <div className="min-h-screen flex flex-col bg-background">
       <Header />
       {renderContent()}
       <footer className="py-6 px-4 md:px-8 border-t">
        <div className="container mx-auto text-center text-muted-foreground text-sm">
          <p>&copy; {new Date().getFullYear()} Shuddh AIR. All rights reserved.</p>
          <p className="mt-1">Air quality data is for informational purposes only.</p>
        </div>
      </footer>
    </div>
  );
}


function TabPlaceholder({ text }: { text: string }) {
    return (
        <Card className="flex items-center justify-center h-96 border-dashed">
            <CardContent className="text-center text-muted-foreground">
                <p>{text}</p>
            </CardContent>
        </Card>
    )
}
