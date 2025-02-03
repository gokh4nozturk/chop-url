import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Pool } from 'pg';
import winston from 'winston';
import swaggerUi from 'swagger-ui-express';
import { ChopUrl } from './ChopUrl';
import { createChopUrlMiddleware } from './middleware';
import { swaggerDocument } from './swagger';

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

// Initialize ChopUrl instance
const chopUrl = new ChopUrl({
    pool,
    baseUrl: process.env.BASE_URL || 'http://localhost:3000'
});

// Initialize Express app
const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Rate limiting
const limiter = rateLimit({
    windowMs: Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    max: Number.parseInt(process.env.RATE_LIMIT_MAX || '100')
});
app.use('/api/', limiter);

// Initialize ChopUrl middleware
const { createUrl, redirect, getStats } = createChopUrlMiddleware({ chopUrl });

// Routes
app.post('/api/urls', createUrl);
app.get('/:shortId', redirect);
app.get('/api/urls/:shortId/stats', getStats);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Initialize database and start server
async function start(): Promise<void> {
    try {
        await chopUrl.initializeDatabase();
        logger.info('Database initialized successfully');

        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            logger.info(`Server is running on port ${PORT}`);
            logger.info(`API Documentation available at http://localhost:${PORT}/api-docs`);
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}

start(); 