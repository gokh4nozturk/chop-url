import type { Request, Response, NextFunction } from 'express';
import type { ChopUrl } from './ChopUrl';

export interface IChopUrlMiddlewareConfig {
    chopUrl: ChopUrl;
}

interface IMiddlewareHandlers {
    createUrl(req: Request, res: Response, next: NextFunction): Promise<void>;
    redirect(req: Request, res: Response, next: NextFunction): Promise<void>;
    getStats(req: Request, res: Response, next: NextFunction): Promise<void>;
}

export function createChopUrlMiddleware(config: IChopUrlMiddlewareConfig): IMiddlewareHandlers {
    const { chopUrl } = config;

    return {
        createUrl: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
            try {
                const { url } = req.body as { url: string };
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

        redirect: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
            try {
                const { shortId } = req.params;
                const originalUrl = await chopUrl.getOriginalUrl(shortId);

                // Log visit
                await chopUrl.logVisit(shortId, {
                    ip: req.ip ?? req.socket.remoteAddress ?? 'unknown',
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

        getStats: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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