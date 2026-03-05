import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseServer as supabase } from '@/lib/supabaseServer'

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const accessToken = cookieStore.get('sb-access-token')?.value

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const bucket = formData.get('bucket') as string
    const path = formData.get('path') as string

    if (!file || !bucket || !path) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { data, error } = await supabase.storage.from(bucket).upload(path, buffer, {
      contentType: file.type,
      upsert: true
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Instead of direct public URL, return the path and proxy URL
    const relativePath = `${bucket}/${path}`;
    const proxyUrl = `/api/proxy-image?path=${encodeURIComponent(relativePath)}`;

    return NextResponse.json({ 
        data: { 
            ...data, 
            path: relativePath,
            proxyUrl: proxyUrl,
            publicUrl: proxyUrl // For backward compatibility with existing code
        } 
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'An error occurred' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const cookieStore = cookies()
    const accessToken = cookieStore.get('sb-access-token')?.value

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { bucket, paths } = await request.json()

    if (!bucket || !paths) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data, error } = await supabase.storage.from(bucket).remove(paths)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'An error occurred' }, { status: 500 })
  }
}
