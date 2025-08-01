'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getNewsAction } from '@/app/actions';
import type { NewsItem } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from './ui/button';
import { Youtube, Rss, VenetianMask, Newspaper, Bot } from 'lucide-react';
import { Skeleton } from './ui/skeleton';

const SourceIcon = ({ source }: { source: string }) => {
  switch (source.toLowerCase()) {
    case 'youtube':
      return <Youtube className="w-5 h-5 text-red-600" />;
    case 'google news':
      return <Newspaper className="w-5 h-5 text-blue-600" />;
    case 'reddit':
      return <VenetianMask className="w-5 h-5 text-orange-600" />;
    default:
      return <Rss className="w-5 h-5 text-gray-500" />;
  }
};

const NewsCard = ({ item }: { item: NewsItem }) => (
  <a href={item.link} target="_blank" rel="noopener noreferrer" className="block hover:bg-slate-50 transition-colors duration-200 rounded-lg">
    <Card className="shadow-none border-0">
      <CardHeader className="flex flex-row items-start gap-4 space-y-0">
        <SourceIcon source={item.source} />
        <div>
          <CardTitle className="text-base font-semibold leading-tight">{item.title}</CardTitle>
          <CardDescription className="text-xs text-muted-foreground mt-1">{item.source}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2">{item.snippet}</p>
      </CardContent>
    </Card>
  </a>
);

const NewsSkeleton = () => (
    <div className="space-y-4">
        <div className="flex items-start gap-4 p-4">
            <Skeleton className="w-6 h-6" />
            <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/4" />
            </div>
        </div>
        <div className="px-4 space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
        </div>
    </div>
)


export function NewsFeed({ city }: { city: string }) {
  const [news, setNews] = useState<NewsItem[] | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      try {
        const result = await getNewsAction({ city });
        if (result.error) {
          throw new Error(result.error);
        }
        if (result.data) {
          setNews(result.data.newsItems);
          setSummary(result.data.summary);
        }
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : 'Could not fetch news.';
        toast({
          variant: 'destructive',
          title: 'Error',
          description: errorMessage,
        });
        setNews([]);
        setSummary('Failed to load news summary.');
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [city, toast]);

  return (
    <div className="space-y-6">
        {loading && (
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Bot className="text-primary"/> AI News Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                </CardContent>
            </Card>
        )}
        {!loading && summary && (
             <Card className="bg-primary/10 border-primary/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg"><Bot className="text-primary"/> AI News Summary for {city}</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm max-w-none">
                    <p>{summary}</p>
                </CardContent>
            </Card>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading && Array.from({ length: 6 }).map((_, i) => <NewsSkeleton key={i}/>)}
            {news?.map((item, index) => (
                <NewsCard key={index} item={item} />
            ))}
        </div>
         {news?.length === 0 && !loading && (
            <div className="text-center py-10">
                <p className="text-muted-foreground">No recent news about air quality found for {city}.</p>
            </div>
        )}
    </div>
  );
}
