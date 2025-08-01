import { config } from 'dotenv';
config();

import '@/ai/flows/geocode-city.ts';
import '@/ai/flows/generate-health-advisory.ts';
import '@/ai/flows/chat.ts';
import '@/ai/flows/generate-pollution-reduction-tips.ts';
import '@/ai/flows/summarize-news.ts';
import '@/ai/flows/reverse-geocode.ts';
