import { NextResponse } from "next/server"

// Add Edge Runtime configuration
export const runtime = 'edge'

// Add CORS headers helper
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() })
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json()
    console.log('Request URL:', url)

    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/urls`
    console.log('Backend URL:', backendUrl)

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      console.error('Backend error:', data)
      return NextResponse.json({ 
        error: data.error || 'Failed to shorten URL',
        details: data
      }, { status: response.status })
    }
    
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to process request',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
} 