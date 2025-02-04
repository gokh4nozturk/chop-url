interface Env {
  DB: D1Database;
  FRONTEND_URL: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const shortId = url.pathname.slice(1);

    // If no shortId is provided or it's empty, redirect to frontend
    if (!shortId || shortId.trim() === '') {
      return Response.redirect(env.FRONTEND_URL, 301);
    }

    try {
      const result = await env.DB.prepare(
        'SELECT original_url FROM urls WHERE short_id = ?'
      ).bind(shortId).first<{ original_url: string }>();

      if (!result) {
        // If shortId is not found, redirect to frontend with the shortId as query param
        const redirectUrl = new URL(env.FRONTEND_URL);
        redirectUrl.searchParams.set('error', `Short URL '${shortId}' not found`);
        return Response.redirect(redirectUrl.toString(), 301);
      }

      // Log visit asynchronously
      env.DB.prepare(
        'UPDATE urls SET visit_count = visit_count + 1, last_accessed_at = CURRENT_TIMESTAMP WHERE short_id = ?'
      ).bind(shortId).run();

      return Response.redirect(result.original_url, 301);
    } catch (error) {
      console.error('Error retrieving URL:', error);
      // If there's an error, redirect to frontend with error message
      const redirectUrl = new URL(env.FRONTEND_URL);
      redirectUrl.searchParams.set('error', 'An error occurred while retrieving the URL');
      return Response.redirect(redirectUrl.toString(), 301);
    }
  }
}; 