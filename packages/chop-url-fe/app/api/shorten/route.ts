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
    const body = await request.json()
    console.log('Request body:', body)
    
    if (!body || typeof body.url !== 'string') {
      console.error('Invalid request body:', body)
      return NextResponse.json({ 
        error: 'Invalid request: URL is required',
      }, { status: 400 })
    }

    const url = body.url.trim()
    console.log('Processing URL:', url)

    // Validate URL format
    try {
      new URL(url)
    } catch (e) {
      console.error('Invalid URL format:', e)
      return NextResponse.json({ 
        error: 'Invalid URL format',
      }, { status: 400 })
    }

    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/shorten`
    console.log('Backend URL:', backendUrl)

    const requestBody = JSON.stringify({
      url,
      customSlug: body.customSlug
    })
    console.log('Request body being sent:', requestBody)

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: requestBody,
    })
    
    console.log('Response status:', response.status)
    console.log('Response headers:', Object.fromEntries(response.headers.entries()))
    
    const responseText = await response.text()
    console.log('Raw response:', responseText)
    
    if (!response.ok) {
      let errorData
      try {
        errorData = JSON.parse(responseText)
      } catch (e) {
        console.error('Failed to parse error response:', e)
        errorData = { error: responseText }
      }
      
      console.error('Backend error:', errorData)
      return NextResponse.json({ 
        error: errorData.error || 'Failed to shorten URL',
        details: errorData
      }, { 
        status: response.status,
        headers: corsHeaders()
      })
    }
    
    let data
    try {
      data = JSON.parse(responseText)
    } catch (e) {
      console.error('Failed to parse success response:', e)
      return NextResponse.json({ 
        error: 'Invalid response from backend',
        details: responseText
      }, { 
        status: 500,
        headers: corsHeaders()
      })
    }
    
    console.log('Success response data:', data)
    return NextResponse.json(data, { headers: corsHeaders() })
    
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to process request',
      details: error instanceof Error ? error.stack : undefined
    }, { 
      status: 500,
      headers: corsHeaders()
    })
  }
} 