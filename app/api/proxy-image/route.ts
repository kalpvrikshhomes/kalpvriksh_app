import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const urlParam = searchParams.get('url')
  const pathParam = searchParams.get('path')

  // Security: Prevent hotlinking from other domains
  const referer = request.headers.get('referer')
  const host = request.headers.get('host')
  
  if (referer && !referer.includes(host || '') && !referer.includes('localhost')) {
    // Optional: You can add your specific production domain here as well
    // if (!referer.includes('your-production-domain.com'))
    return new NextResponse('Forbidden: Hotlinking is not allowed', { status: 403 })
  }

  if (!urlParam && !pathParam) {
    return new NextResponse('Missing URL or Path', { status: 400 })
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

  if (!supabaseUrl || !supabaseServiceKey) {
    return new NextResponse('Supabase configuration is missing', { status: 500 })
  }

  let targetUrl = ''
  const allowedBuckets = ['project-images', '3d-visualizations']

  if (pathParam) {
    // pathParam should be in the format "bucket/path/to/file.jpg"
    const bucket = pathParam.split('/')[0]
    if (!allowedBuckets.includes(bucket)) {
      return new NextResponse('Unauthorized bucket access', { status: 403 })
    }
    targetUrl = `${supabaseUrl}/storage/v1/object/public/${pathParam}`
  } else if (urlParam) {
    targetUrl = urlParam
    // Security check: only allow Supabase URLs and specific buckets if we can extract them
    if (!targetUrl.startsWith(supabaseUrl) && !targetUrl.includes('.supabase.co')) {
      return new NextResponse('Invalid URL', { status: 403 })
    }
    
    // Attempt to verify bucket if it's a standard public URL
    if (targetUrl.includes('/storage/v1/object/public/')) {
      const pathAfterPublic = targetUrl.split('/storage/v1/object/public/')[1]
      const bucket = pathAfterPublic.split('/')[0]
      if (!allowedBuckets.includes(bucket)) {
        return new NextResponse('Unauthorized bucket access', { status: 403 })
      }
    }
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`
      }
    })

    if (!response.ok) {
      console.error(`Error fetching image from Supabase: ${response.status} ${response.statusText}`)
      return new NextResponse('Error fetching image', { status: response.status })
    }

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
