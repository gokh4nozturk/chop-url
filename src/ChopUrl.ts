import { Pool } from 'pg';
import { nanoid } from 'nanoid';
import { CreateUrlResponse, UrlStats } from './types';

export interface ChopUrlConfig {
    pool: Pool;
    baseUrl: string;
    shortIdLength?: number;
}

export class ChopUrl {
    private pool: Pool;
    private baseUrl: string;
    private shortIdLength: number;

    constructor(config: ChopUrlConfig) {
        this.pool = config.pool;
        this.baseUrl = config.baseUrl;
        this.shortIdLength = config.shortIdLength || 8;
    }

    async createShortUrl(originalUrl: string): Promise<CreateUrlResponse> {
        const shortId = nanoid(this.shortIdLength);
        await this.pool.query(
            'INSERT INTO urls (short_id, original_url) VALUES ($1, $2)',
            [shortId, originalUrl]
        );

        return {
            shortUrl: `${this.baseUrl}/${shortId}`,
            originalUrl,
            shortId
        };
    }

    async getOriginalUrl(shortId: string): Promise<string> {
        const result = await this.pool.query(
            'UPDATE urls SET visit_count = visit_count + 1, last_accessed_at = CURRENT_TIMESTAMP WHERE short_id = $1 RETURNING original_url',
            [shortId]
        );

        if (result.rows.length === 0) {
            throw new Error('URL not found');
        }

        return result.rows[0].original_url;
    }

    async logVisit(shortId: string, visitorInfo: { ip: string; userAgent?: string; referrer?: string }): Promise<void> {
        const urlResult = await this.pool.query('SELECT id FROM urls WHERE short_id = $1', [shortId]);
        if (urlResult.rows.length === 0) {
            throw new Error('URL not found');
        }

        await this.pool.query(
            'INSERT INTO visits (url_id, ip_address, user_agent, referrer) VALUES ($1, $2, $3, $4)',
            [urlResult.rows[0].id, visitorInfo.ip, visitorInfo.userAgent || null, visitorInfo.referrer || null]
        );
    }

    async getUrlStats(shortId: string): Promise<UrlStats> {
        const result = await this.pool.query(
            'SELECT * FROM urls WHERE short_id = $1',
            [shortId]
        );

        if (result.rows.length === 0) {
            throw new Error('URL not found');
        }

        const visits = await this.pool.query(
            'SELECT COUNT(*) as total_visits FROM visits WHERE url_id = $1',
            [result.rows[0].id]
        );

        return {
            shortId,
            originalUrl: result.rows[0].original_url,
            created: result.rows[0].created_at,
            lastAccessed: result.rows[0].last_accessed_at,
            visitCount: result.rows[0].visit_count,
            totalVisits: Number.parseInt(visits.rows[0].total_visits)
        };
    }

    async initializeDatabase(): Promise<void> {
        const schemaSQL = `
            CREATE TABLE IF NOT EXISTS urls (
                id SERIAL PRIMARY KEY,
                short_id VARCHAR(10) UNIQUE NOT NULL,
                original_url TEXT NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                last_accessed_at TIMESTAMP WITH TIME ZONE,
                visit_count INTEGER DEFAULT 0
            );

            CREATE INDEX IF NOT EXISTS idx_urls_short_id ON urls(short_id);

            CREATE TABLE IF NOT EXISTS visits (
                id SERIAL PRIMARY KEY,
                url_id INTEGER REFERENCES urls(id),
                visited_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                ip_address VARCHAR(45),
                user_agent TEXT,
                referrer TEXT
            );

            CREATE INDEX IF NOT EXISTS idx_visits_url_id ON visits(url_id);
            CREATE INDEX IF NOT EXISTS idx_visits_visited_at ON visits(visited_at);
        `;

        await this.pool.query(schemaSQL);
    }
} 