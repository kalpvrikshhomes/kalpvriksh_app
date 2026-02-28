
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = cookies()
    const accessToken = cookieStore.get('sb-access-token')?.value
    // In a real app, you'd verify this with Supabase or your own verification.
    // For now, let's just use it to fetch the user.

    if (!accessToken) {
      return NextResponse.json({ user: null })
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase configuration is missing' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get user from token
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)

    if (error || !user) {
      // Token might be expired, clear cookies
      cookieStore.delete('sb-access-token')
      cookieStore.delete('sb-refresh-token')
      return NextResponse.json({ user: null })
    }

    // Fetch profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    return NextResponse.json({ 
      user: {
        id: user.id,
        email: user.email,
        full_name: profile?.full_name,
        role: profile?.role
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'An error occurred fetching session' }, { status: 500 })
  }
}
