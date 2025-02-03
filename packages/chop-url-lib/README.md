# @chop-url/lib

A TypeScript library for URL shortening functionality.

## Installation

```bash
npm install @chop-url/lib
```

## Usage

```typescript
import { ChopUrl } from '@chop-url/lib';

// Initialize the ChopUrl instance
const chopUrl = new ChopUrl({
  baseUrl: 'https://your-domain.com',
  db: yourD1Database
});

// Create a short URL
const urlInfo = await chopUrl.createShortUrl('https://very-long-url.com');
console.log(urlInfo.shortUrl); // https://your-domain.com/abc123

// Get original URL from short ID
const originalUrl = await chopUrl.getOriginalUrl('abc123');

// Get URL information
const info = await chopUrl.getUrlInfo('abc123');
console.log(info.visits); // Number of visits
```

## API Reference

### `ChopUrl`

The main class for URL shortening operations.

#### Constructor

```typescript
constructor(config: ChopUrlConfig)
```

- `config.baseUrl`: Base URL for generating short URLs
- `config.db`: D1Database instance for storage

#### Methods

##### `createShortUrl(url: string): Promise<UrlInfo>`

Creates a short URL for the given original URL.

##### `getOriginalUrl(shortId: string): Promise<string>`

Retrieves the original URL for a given short ID.

##### `getUrlInfo(shortId: string): Promise<UrlInfo>`

Gets detailed information about a shortened URL.

### Types

#### `UrlInfo`

```typescript
interface UrlInfo {
  shortId: string;      // The generated short ID
  originalUrl: string;  // The original URL
  shortUrl: string;     // The complete short URL
  createdAt: Date;      // Creation timestamp
  visits: number;       // Number of visits
}
```

## License

MIT 