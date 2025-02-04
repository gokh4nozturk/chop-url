interface Env {
  DB: D1Database;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const shortId = url.pathname.slice(1);

    if (!shortId) {
      return Response.redirect('https://app.chop-url.com', 301);
    }

    try {
      const result = await env.DB.prepare(
        'SELECT original_url FROM urls WHERE short_id = ?'
      ).bind(shortId).first<{ original_url: string }>();

      if (!result) {
        return Response.redirect('https://app.chop-url.com', 301);
      }

      // Log visit asynchronously
      env.DB.prepare(
        'UPDATE urls SET visit_count = visit_count + 1, last_accessed_at = CURRENT_TIMESTAMP WHERE short_id = ?'
      ).bind(shortId).run();

      return Response.redirect(result.original_url, 301);
    } catch (error) {
      console.error('Error retrieving URL:', error);
      return Response.redirect('https://app.chop-url.com', 301);
    }
  }
}; 