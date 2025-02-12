import { NextResponse } from 'next/server';

// Add Edge Runtime configuration
export const runtime = 'edge';

// Add CORS headers helper
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
    'Access-Control-Allow-Headers':
      'Content-Type, Authorization, Accept, Origin, X-Requested-With, Access-Control-Allow-Origin, Access-Control-Allow-Credentials',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Expose-Headers':
      'Content-Type, Authorization, Access-Control-Allow-Origin, Access-Control-Allow-Credentials',
    'Access-Control-Max-Age': '86400',
  };
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body || typeof body.url !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request: URL is required' },
        { status: 400, headers: corsHeaders() }
      );
    }

    const url = body.url.trim();

    // Validate URL format
    try {
      new URL(url);
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400, headers: corsHeaders() }
      );
    }

    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/chop`;

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Origin: process.env.NEXT_PUBLIC_URL || 'http://localhost:3000',
      },
      credentials: 'include',
      body: JSON.stringify({
        url,
        customSlug: body.customSlug,
      }),
    });

    const responseText = await response.text();

    if (!response.ok) {
      let errorData: { error: string } | undefined;
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = { error: 'Failed to parse error response' };
      }

      if (response.status === 409) {
        return NextResponse.json(
          {
            error: 'This custom URL is already taken. Please try another one.',
          },
          { status: 409, headers: corsHeaders() }
        );
      }

      return NextResponse.json(
        { error: errorData?.error || 'Failed to create short URL' },
        { status: response.status, headers: corsHeaders() }
      );
    }

    let data:
      | { shortUrl: string; shortId: string; expiresAt: string | null }
      | undefined;
    try {
      data = JSON.parse(responseText);
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse response' },
        { status: 500, headers: corsHeaders() }
      );
    }

    console.log(data);

    return NextResponse.json(data, { headers: corsHeaders() });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to process request',
      },
      { status: 500, headers: corsHeaders() }
    );
  }
}
