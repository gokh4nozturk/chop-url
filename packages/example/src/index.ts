import { ChopUrl } from '@chop-url/lib';

// Mock D1Database for testing
const mockDb = {
  prepare: (query: string) => ({
    bind: (...args: any[]) => ({
      run: async () => ({}),
      first: async () => ({ original_url: 'https://www.example.com' })
    })
  })
} as any;

async function main() {
  const longUrl = 'https://www.example.com/very/long/url/that/needs/to/be/shortened';
  
  try {
    const chopUrl = new ChopUrl({
      baseUrl: 'https://chop.url',
      db: mockDb
    });
    
    const urlInfo = await chopUrl.createShortUrl(longUrl);
    console.log('Original URL:', urlInfo.originalUrl);
    console.log('Shortened URL:', urlInfo.shortUrl);
    console.log('Short ID:', urlInfo.shortId);
    console.log('Created at:', urlInfo.createdAt);
    console.log('Visits:', urlInfo.visits);
    
    const originalUrl = await chopUrl.getOriginalUrl(urlInfo.shortId);
    console.log('\nResolved URL:', originalUrl);
  } catch (error) {
    console.error('Error:', error);
  }
}

main().catch(console.error); 