import { Env, Variables } from '@/types';
import { OpenAPIHono, createRoute } from '@hono/zod-openapi';

/**
 * IMPORTANT: These endpoints have been consolidated under the main analytics router.
 * Please use the following endpoints instead:
 *
 * - GET /analytics/url/:id/stats - Get statistics for a specific URL
 * - GET /analytics/url/list - Get statistics for all URLs of the authenticated user
 * - GET /analytics/url/export - Export URL statistics data
 *
 * This file is kept for backward compatibility but will be removed in a future release.
 */

const analyticsRouter = new OpenAPIHono<{
  Bindings: Env;
  Variables: Variables;
}>();

// Redirect old endpoints to new consolidated analytics endpoints
analyticsRouter.get('/:id', (c) => {
  const url = new URL(c.req.url);
  const id = c.req.param('id');
  const period = c.req.query('period') || '24h';

  url.pathname = `/analytics/url/${id}/stats`;
  url.searchParams.set('period', period);

  return c.redirect(url.toString());
});

analyticsRouter.get('/list', (c) => {
  const url = new URL(c.req.url);
  const period = c.req.query('period') || '7d';

  url.pathname = '/analytics/url/list';
  url.searchParams.set('period', period);

  return c.redirect(url.toString());
});

analyticsRouter.get('/export', (c) => {
  const url = new URL(c.req.url);
  const period = c.req.query('period') || '7d';

  url.pathname = '/analytics/url/export';
  url.searchParams.set('period', period);

  return c.redirect(url.toString());
});

export default analyticsRouter;
