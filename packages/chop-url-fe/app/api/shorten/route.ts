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

    const fetchOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ url }),
    }

    try {
      console.log('Sending request to backend...')
      const response = await fetch(backendUrl, fetchOptions)
      console.log('Response status:', response.status)
      console.log('Response headers:', Object.fromEntries(response.headers))
      
      const responseText = await response.text()
      console.log('Response text:', responseText)

      let data
      try {
        data = JSON.parse(responseText)
        console.log('Parsed response:', data)
      } catch (e) {
        console.error('Failed to parse response as JSON:', e)
        return new NextResponse(
          JSON.stringify({ 
            error: 'Invalid response from server',
            details: responseText
          }), 
          { 
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders()
            }
          }
        )
      }

      if (!response.ok) {
        console.error('Backend error:', data)
        return new NextResponse(
          JSON.stringify({ 
            error: data.error || 'Failed to shorten URL',
            details: data
          }),
          { 
            status: response.status,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders()
            }
          }
        )
      }
    
      return new NextResponse(
        JSON.stringify(data),
        { 
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders()
          }
        }
      )
    } catch (error) {
      console.error('Fetch error:', error)
      return new NextResponse(
        JSON.stringify({ 
          error: error instanceof Error ? `Network error: ${error.message}` : 'Network error',
          details: error
        }),
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders()
          }
        }
      )
    }
  } catch (error) {
    console.error('Request parsing error:', error)
    return new NextResponse(
      JSON.stringify({
        error: 'Invalid request',
        details: error instanceof Error ? error.message : 'Failed to parse request'
      }),
      { 
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders()
        }
      }
    )
  }
} 