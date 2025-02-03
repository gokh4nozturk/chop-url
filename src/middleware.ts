import { Request, Response, NextFunction } from 'express';
import { ChopUrl } from './ChopUrl';

export interface ChopUrlMiddlewareConfig {
    chopUrl: ChopUrl;
    prefix?: string;
}

export function createChopUrlMiddleware(config: ChopUrlMiddlewareConfig) {
    const { chopUrl, prefix = '' } = config;

    return {
        createUrl: async (req: Request, res: Response, next: NextFunction) => {
            try {
                const { url } = req.body;
                if (!url) {
                    res.status(400).json({ error: 'URL is required' });
                    return;
                }

                const result = await chopUrl.createShortUrl(url);
                res.json(result);
            } catch (error) {
                next(error);
            }
        },

        redirect: async (req: Request, res: Response, next: NextFunction) => {
            try {
                const { shortId } = req.params;
                const originalUrl = await chopUrl.getOriginalUrl(shortId);

                // Log visit
                await chopUrl.logVisit(shortId, {
                    ip: req.ip || req.socket.remoteAddress || 'unknown',
                    userAgent: req.get('user-agent'),
                    referrer: req.get('referrer')
                });

                res.redirect(originalUrl);
            } catch (error) {
                if (error instanceof Error && error.message === 'URL not found') {
                    res.status(404).json({ error: 'URL not found' });
                    return;
                }
                next(error);
            }
        },

        getStats: async (req: Request, res: Response, next: NextFunction) => {
            try {
                const { shortId } = req.params;
                const stats = await chopUrl.getUrlStats(shortId);
                res.json(stats);
            } catch (error) {
                if (error instanceof Error && error.message === 'URL not found') {
                    res.status(404).json({ error: 'URL not found' });
                    return;
                }
                next(error);
            }
        }
    };
} 