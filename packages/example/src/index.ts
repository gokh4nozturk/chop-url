import { ChopUrl, type Database, type ICreateUrlResponse } from '@chop-url/lib';

const mockDb: Database = {
  prepare: (query: string) => ({
    bind: (...params: unknown[]) => ({
      run: async () => Promise.resolve({}),
      first: async <T>() => Promise.resolve<T | undefined>(undefined),
      all: async <T>() => Promise.resolve({ results: [] as T[] }),
    }),
  }),
};

async function main() {
  const chopUrl = new ChopUrl({
    baseUrl: 'http://localhost:3000',
    db: mockDb,
  });

  const urlInfo: ICreateUrlResponse = await chopUrl.createShortUrl(
    'https://www.example.com'
  );
  console.log('Short URL:', urlInfo.shortUrl);

  const originalUrl = await chopUrl.getOriginalUrl(urlInfo.shortId);
  console.log('Original URL:', originalUrl);
}

main().catch(console.error);
