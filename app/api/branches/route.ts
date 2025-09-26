import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const queryParams = searchParams.toString()
    
    const backendUrl = `${BACKEND_URL}/branches${queryParams ? `?${queryParams}` : ''}`
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Forward any authorization headers
        ...(request.headers.get('authorization') && { 
          'Authorization': request.headers.get('authorization')!
        })
      }
    })

    if (!response.ok) {
      console.error(`Backend branches API error: ${response.status} ${response.statusText}`)
      return NextResponse.json(
        { message: `Backend API error: ${response.status}`, items: [] },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('Branches fetched from backend:', data)

    return NextResponse.json(data)
  } catch (error) {
    console.error('Branches API Error:', error)
    return NextResponse.json(
      { 
        message: 'Internal server error',
        items: [],
        error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const response = await fetch(`${BACKEND_URL}/branches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(request.headers.get('authorization') && { 
          'Authorization': request.headers.get('authorization')!
        })
      },
      body: JSON.stringify(body)
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Create Branch API Error:', error)
    return NextResponse.json(
      { 
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
      },
      { status: 500 }
    )
  }
}