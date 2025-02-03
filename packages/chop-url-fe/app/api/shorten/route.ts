import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { url } = await request.json()

    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/urls`

    const fetchOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ url }),
    }

    try {
      const response = await fetch(backendUrl, fetchOptions)
      const responseText = await response.text()

      let data
      try {
        data = JSON.parse(responseText)
      } catch (e) {
        console.error('Failed to parse response as JSON:', e)
        throw new Error('Invalid response from server')
      }

      if (!response.ok) {
        console.error('Backend error:', data)
        throw new Error(data.error || 'Failed to shorten URL')
      }
    
      return NextResponse.json(data)
    } catch (error) {
      console.error('Fetch error:', error)
      if (error instanceof Error) {
        throw new Error(`Network error: ${error.message}`)
      }
      throw new Error('Network error: Unknown error occurred')
    }
  } catch (error) {
    console.error('Error in API route:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to shorten URL" },
      { status: 500 }
    )
  }
} 