import { NextResponse } from 'next/server'
import { supabaseServer as supabase } from '@/lib/supabaseServer'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  let urlParam = searchParams.get('url')
  let pathParam = searchParams.get('path')

  // 1. Security: Prevent hotlinking from other domains
  const referer = request.headers.get('referer')
  const host = request.headers.get('host')
  
  if (referer) {
    try {
      const refererUrl = new URL(referer)
      const refererHostname = refererUrl.hostname
      const currentHost = host?.split(':')[0] || ''
      
      if (refererHostname !== currentHost && refererHostname !== 'localhost' && !refererHostname.includes('vercel.app')) {
        return new NextResponse('Forbidden: Hotlinking is not allowed', { status: 403 })
      }
    } catch (e) {}
  }

  // 2. Self-Healing: Handle "broken" URLs missing the '?' that might come in as part of the path
  if (!pathParam && !urlParam) {
    const fullUrl = request.url;
    if (fullUrl.includes('proxy-imagepath=')) {
        pathParam = fullUrl.split('proxy-imagepath=')[1];
    } else if (fullUrl.includes('proxy-imageurl=')) {
        urlParam = fullUrl.split('proxy-imageurl=')[1];
    }
  }

  if (!urlParam && !pathParam) {
    return new NextResponse('Missing URL or Path', { status: 400 })
  }

  try {
    let bucket = ''
    let key = ''

    if (pathParam) {
      // Decode the path in case it's double encoded
      const decodedPath = decodeURIComponent(pathParam)
      const parts = decodedPath.split('/')
      bucket = parts[0]
      key = parts.slice(1).join('/')
    } else if (urlParam) {
      const decodedUrl = decodeURIComponent(urlParam)
      if (decodedUrl.includes('/storage/v1/object/public/')) {
        const pathAfterPublic = decodedUrl.split('/storage/v1/object/public/')[1]
        const parts = pathAfterPublic.split('/')
        bucket = parts[0]
        key = parts.slice(1).join('/')
      }
    }

    const allowedBuckets = ['project-images', '3d-visualizations']
    if (!allowedBuckets.includes(bucket)) {
      return new NextResponse('Unauthorized bucket access', { status: 403 })
    }

    // 3. Use the SDK download method (Works for Private buckets + handles encoding)
    const { data, error } = await supabase.storage.from(bucket).download(key)

    if (error || !data) {
      console.error(`Supabase Storage Error: ${error?.message || 'No data'}`)
      return new NextResponse('Error fetching image from storage', { status: 404 })
    }

    const buffer = await data.arrayBuffer()
    
    const headers = new Headers()
    headers.set('Content-Type', data.type || 'image/png')
    headers.set('Cache-Control', 'public, max-age=31536000, immutable')

    return new NextResponse(buffer, {
      status: 200,
      headers,
    })
  } catch (error: any) {
    console.error('Image proxy exception:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
