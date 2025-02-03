# Chop-URL

A modern URL shortening service and library built with Node.js, Express, and PostgreSQL.

## Features

- Create short URLs from long ones
- Track URL visit statistics
- Built-in Express middleware
- TypeScript support
- PostgreSQL for reliable storage
- Visit tracking and analytics
- Rate limiting support
- Production-ready error handling

## Installation

```bash
npm install chop-url
```

## Usage

### As a Library

```typescript
import { ChopUrl } from 'chop-url';
import { Pool } from 'pg';

// Initialize PostgreSQL connection
const pool = new Pool({
    connectionString: 'postgresql://user:password@localhost:5432/chopurl'
});

// Create ChopUrl instance
const chopUrl = new ChopUrl({
    pool,
    baseUrl: 'https://your-domain.com'
});

// Initialize database (creates tables if they don't exist)
await chopUrl.initializeDatabase();

// Create a short URL
const shortUrl = await chopUrl.createShortUrl('https://very-long-url.com/path');
console.log(shortUrl);
// { shortUrl: 'https://your-domain.com/abc123', originalUrl: '...', shortId: 'abc123' }

// Get original URL
const originalUrl = await chopUrl.getOriginalUrl('abc123');

// Get URL statistics
const stats = await chopUrl.getUrlStats('abc123');
```

### With Express

```typescript
import express from 'express';
import { ChopUrl, createChopUrlMiddleware } from 'chop-url';

const app = express();
app.use(express.json());

const chopUrl = new ChopUrl({
    pool,
    baseUrl: 'https://your-domain.com'
});

const { createUrl, redirect, getStats } = createChopUrlMiddleware({ chopUrl });

// Routes
app.post('/api/urls', createUrl);           // Create short URL
app.get('/:shortId', redirect);            // Redirect to original URL
app.get('/api/urls/:shortId/stats', getStats); // Get URL statistics
```

### As a Standalone Service

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

4. Configure your environment variables in `.env`:
   ```
   PORT=3000
   DATABASE_URL=postgresql://user:password@localhost:5432/chopurl
   BASE_URL=http://localhost:3000
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX=100
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Create Short URL
- **POST** `/api/urls`
  ```json
  {
    "url": "https://very-long-url.com/path"
  }
  ```

### Redirect to Original URL
- **GET** `/:shortId`

### Get URL Statistics
- **GET** `/api/urls/:shortId/stats`

## Configuration

The `ChopUrl` constructor accepts the following options:

```typescript
interface ChopUrlConfig {
    pool: Pool;              // PostgreSQL connection pool
    baseUrl: string;         // Base URL for short links
    shortIdLength?: number;  // Length of generated short IDs (default: 8)
}
```

## Development

```bash
# Run tests
npm test

# Build
npm run build

# Run linter
npm run lint

# Type check
npm run type-check
```

## License

MIT 