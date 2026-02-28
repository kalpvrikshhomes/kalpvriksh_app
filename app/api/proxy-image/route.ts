
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return new NextResponse('Missing URL', { status: 400 })
  }

  // Only allow proxying from your Supabase domain for security
  if (!url.startsWith('https://atzrfldrqyvjyuvnhkvb.supabase.co')) {
    return new NextResponse('Invalid URL', { status: 403 })
  }

  try {
    const response = await fetch(url)
    const blob = await response.blob()
    
    const headers = new Headers()
    headers.set('Content-Type', response.headers.get('Content-Type') || 'image/png')
    headers.set('Cache-Control', 'public, max-age=31536000, immutable')

    return new NextResponse(blob, {
      status: 200,
      headers,
    })
  } catch (error) {
    console.error('Image proxy error:', error)
    return new NextResponse('Error fetching image', { status: 500 })
  }
}
