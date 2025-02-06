import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

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

type Params = Promise<{
  shortId: string;
}>;

interface StatsResponse {
  visitCount: number;
  lastAccessedAt: string | null;
  createdAt: string;
  originalUrl: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { shortId } = await params;

    if (!shortId) {
      return NextResponse.json(
        { error: 'Short ID is required' },
        { status: 400, headers: corsHeaders() }
      );
    }

    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/stats/${shortId}`;

    const response = await fetch(backendUrl, {
      headers: {
        Accept: 'application/json',
        Origin: process.env.NEXT_PUBLIC_URL || 'http://localhost:3000',
      },
      credentials: 'include',
    });

    const responseText = await response.text();

    if (!response.ok) {
      let errorData: { error: string } | undefined;
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = { error: 'Failed to parse error response' };
      }
      return NextResponse.json(
        { error: errorData?.error || 'Failed to fetch stats' },
        { status: response.status, headers: corsHeaders() }
      );
    }

    let data: StatsResponse;
    try {
      data = JSON.parse(responseText);
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse response' },
        { status: 500, headers: corsHeaders() }
      );
    }

    return NextResponse.json(data, { headers: corsHeaders() });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch stats',
      },
      { status: 500, headers: corsHeaders() }
    );
  }
}
