import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { url } = await request.json()

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/urls`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    })

    if (!response.ok) {
      throw new Error('Failed to shorten URL')
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error shortening URL:', error)
    return NextResponse.json(
      { error: "Failed to shorten URL" },
      { status: 500 }
    )
  }
} 