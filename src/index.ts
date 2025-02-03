import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Pool } from 'pg';
import winston from 'winston';
import { nanoid } from 'nanoid';
import { CreateUrlResponse, UrlStats } from './types';

// Initialize logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}

// Initialize PostgreSQL connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

// Initialize Express app
const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
    windowMs: Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    max: Number.parseInt(process.env.RATE_LIMIT_MAX || '100')
});
app.use('/api/', limiter);

// Routes
app.post('/api/urls', async (req: Request, res: Response): Promise<void> => {
    try {
        const { url } = req.body;
        if (!url) {
            res.status(400).json({ error: 'URL is required' });
            return;
        }

        const shortId = nanoid(8);
        const result = await pool.query(
            'INSERT INTO urls (short_id, original_url) VALUES ($1, $2) RETURNING *',
            [shortId, url]
        );

        const response: CreateUrlResponse = {
            shortUrl: `${process.env.BASE_URL}/${shortId}`,
            originalUrl: url,
            shortId
        };
        res.json(response);
    } catch (error) {
        logger.error('Error creating short URL:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/:shortId', async (req: Request, res: Response): Promise<void> => {
    try {
        const { shortId } = req.params;
        const result = await pool.query(
            'UPDATE urls SET visit_count = visit_count + 1, last_accessed_at = CURRENT_TIMESTAMP WHERE short_id = $1 RETURNING original_url',
            [shortId]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'URL not found' });
            return;
        }

        // Log visit
        const urlResult = await pool.query('SELECT id FROM urls WHERE short_id = $1', [shortId]);
        await pool.query(
            'INSERT INTO visits (url_id, ip_address, user_agent, referrer) VALUES ($1, $2, $3, $4)',
            [urlResult.rows[0].id, req.ip, req.get('user-agent'), req.get('referrer')]
        );

        res.redirect(result.rows[0].original_url);
    } catch (error) {
        logger.error('Error redirecting URL:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/urls/:shortId/stats', async (req: Request, res: Response): Promise<void> => {
    try {
        const { shortId } = req.params;
        const result = await pool.query(
            'SELECT * FROM urls WHERE short_id = $1',
            [shortId]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'URL not found' });
            return;
        }

        const visits = await pool.query(
            'SELECT COUNT(*) as total_visits FROM visits WHERE url_id = $1',
            [result.rows[0].id]
        );

        const stats: UrlStats = {
            shortId,
            originalUrl: result.rows[0].original_url,
            created: result.rows[0].created_at,
            lastAccessed: result.rows[0].last_accessed_at,
            visitCount: result.rows[0].visit_count,
            totalVisits: Number.parseInt(visits.rows[0].total_visits)
        };
        res.json(stats);
    } catch (error) {
        logger.error('Error fetching URL stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
});

export { ChopUrl, ChopUrlConfig } from './ChopUrl';
export { createChopUrlMiddleware, ChopUrlMiddlewareConfig } from './middleware';
export * from './types'; 