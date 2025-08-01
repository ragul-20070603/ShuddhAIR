import type { NewsItem } from '@/types';
import * as cheerio from 'cheerio';

const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
const REDDIT_CLIENT_ID = process.env.NEXT_PUBLIC_REDDIT_CLIENT_ID;
const REDDIT_CLIENT_SECRET = process.env.NEXT_PUBLIC_REDDIT_CLIENT_SECRET;
const REDDIT_USER_AGENT = process.env.NEXT_PUBLIC_REDDIT_USER_AGENT;
const REDDIT_USERNAME = process.env.NEXT_PUBLIC_REDDIT_USERNAME;
const REDDIT_PASSWORD = process.env.NEXT_PUBLIC_REDDIT_PASSWORD;

async function fetchYoutubeNews(city: string): Promise<NewsItem[]> {
    if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY === "YOUR_YOUTUBE_API_KEY") {
        console.warn("YouTube API key not set. Skipping YouTube news fetch.");
        return [];
    }

    const query = encodeURIComponent(`air quality news ${city}`);
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&maxResults=5&key=${YOUTUBE_API_KEY}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`YouTube API error: ${response.statusText}`);
        }
        const data = await response.json();
        return data.items.map((item: any) => ({
            title: item.snippet.title,
            snippet: item.snippet.description,
            link: `https://www.youtube.com/watch?v=${item.id.videoId}`,
            source: 'YouTube',
        }));
    } catch (error) {
        console.error("Failed to fetch YouTube news:", error);
        return [];
    }
}


async function fetchGoogleNews(city: string): Promise<NewsItem[]> {
    const query = encodeURIComponent(`air quality ${city}`);
    const url = `https://news.google.com/search?q=${query}&hl=en-US&gl=US&ceid=US:en`;

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch Google News: ${response.statusText}`);
        }
        const html = await response.text();
        const $ = cheerio.load(html);

        const articles: NewsItem[] = [];
        $('article').slice(0, 5).each((i, el) => {
            const title = $(el).find('h3').text() || 'No title';
            const link = $(el).find('a').attr('href');
            const source = $(el).find('div[data-n-tid]').text() || 'Google News';

            if (title && link) {
                articles.push({
                    title,
                    snippet: $(el).find('span').first().text() || title,
                    link: `https://news.google.com${link.startsWith('.') ? link.substring(1) : link}`,
                    source: 'Google News',
                });
            }
        });
        return articles;
    } catch (error) {
        console.error("Failed to fetch Google News:", error);
        return [];
    }
}

async function getRedditAccessToken() {
    if (!REDDIT_CLIENT_ID || !REDDIT_CLIENT_SECRET || !REDDIT_USERNAME || !REDDIT_PASSWORD) {
        return null;
    }
    const response = await fetch('https://www.reddit.com/api/v1/access_token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(REDDIT_CLIENT_ID + ':' + REDDIT_CLIENT_SECRET).toString('base64'),
            'User-Agent': REDDIT_USER_AGENT || "ShuddhAI/1.0"
        },
        body: `grant_type=password&username=${REDDIT_USERNAME}&password=${REDDIT_PASSWORD}`
    });
    const data = await response.json();
    return data.access_token;
}

async function fetchRedditNews(city: string): Promise<NewsItem[]> {
    const accessToken = await getRedditAccessToken();
    if (!accessToken) {
        console.warn("Reddit API credentials not set or invalid. Skipping Reddit news fetch.");
        return [];
    }

    const query = encodeURIComponent(`air quality ${city}`);
    const url = `https://oauth.reddit.com/r/news/search?q=${query}&restrict_sr=on&sort=new&limit=5`;

    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'User-Agent': REDDIT_USER_AGENT || "ShuddhAI/1.0"
            }
        });
        if (!response.ok) {
            throw new Error(`Reddit API error: ${response.statusText}`);
        }
        const data = await response.json();

        return data.data.children.map((post: any) => ({
            title: post.data.title,
            snippet: post.data.selftext || post.data.title,
            link: `https://www.reddit.com${post.data.permalink}`,
            source: 'Reddit',
        }));
    } catch (error) {
        console.error("Failed to fetch Reddit news:", error);
        return [];
    }
}


export async function getNews(city: string): Promise<NewsItem[]> {
    try {
        const [youtubeNews, googleNews, redditNews] = await Promise.all([
            fetchYoutubeNews(city),
            fetchGoogleNews(city),
            fetchRedditNews(city),
        ]);

        return [...youtubeNews, ...googleNews, ...redditNews];
    } catch (error) {
        console.error("Error fetching news:", error);
        throw error;
    }
}
