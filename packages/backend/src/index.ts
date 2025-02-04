import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import { ChopUrl, ChopUrlError } from '@chop-url/lib';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Initialize ChopUrl
const chopUrl = new ChopUrl({
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  db: pool
});

// Routes
app.post('/api/shorten', async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const urlInfo = await chopUrl.createShortUrl(url);
    res.json(urlInfo);
  } catch (error: unknown) {
    console.error('Error shortening URL:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/:shortId', async (req: Request, res: Response) => {
  try {
    const { shortId } = req.params;
    const originalUrl = await chopUrl.getOriginalUrl(shortId);
    res.json({ url: originalUrl });
  } catch (error: unknown) {
    if (error instanceof ChopUrlError && error.code === 'URL_NOT_FOUND') {
      return res.status(404).json({ error: 'URL not found' });
    }
    console.error('Error expanding URL:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}); 