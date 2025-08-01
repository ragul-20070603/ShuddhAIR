'use client';

import { useState } from 'react';
import { HealthForm } from '@/components/health-form';
import { ResultsDisplay } from '@/components/results-display';
import { XaiSection } from '@/components/xai-section';
import { getHealthAdvisoryAction } from '@/app/actions';
import type { AdvisoryResult } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { Chatbot } from '@/components/chatbot';
import { Header } from '@/components/header';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<AdvisoryResult | null>(null);
  const { toast } = useToast();

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
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred.";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
       <Header />

      <main className="flex-grow container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 gap-12">
          <section className="space-y-4">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold font-headline tracking-tight">Your Personal Air Quality Advisor</h2>
              <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
                Enter your details to receive personalized health recommendations based on the current air quality in your area.
              </p>
            </div>
            <HealthForm onSubmit={handleFormSubmit} loading={loading} />
          </section>
          
          {loading && (
             <div className="flex justify-center items-center p-8">
                <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary"></div>
             </div>
          )}

          {results && (
            <section id="results">
              <ResultsDisplay data={results} />
            </section>
          )}

          {error && !loading && (
              <div className="text-center text-red-500">
                  <p>There was an error fetching the data. Please try again later.</p>
              </div>
          )}

          {results && <section id="xai">
            <XaiSection />
          </section>}
        </div>
      </main>

      <footer className="py-6 px-4 md:px-8 border-t">
        <div className="container mx-auto text-center text-muted-foreground text-sm">
          <p>&copy; {new Date().getFullYear()} ShuddhAI. All rights reserved.</p>
          <p className="mt-1">Air quality data is for informational purposes only.</p>
        </div>
      </footer>
      <Chatbot />
    </div>
  );
}
