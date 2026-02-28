
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const accessToken = cookieStore.get('sb-access-token')?.value

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { table, action, data, query } = await request.json()

    let dbQuery = supabase.from(table)
    let result

    switch (action) {
      case 'select':
        let selectQuery = dbQuery.select(data?.select || '*')
        if (data?.eq) {
          for (const [key, value] of Object.entries(data.eq)) {
            selectQuery = selectQuery.eq(key, value)
          }
        }
        if (data?.ilike) {
           for (const [key, value] of Object.entries(data.ilike)) {
            selectQuery = selectQuery.ilike(key, value)
          }
        }
        if (data?.single) {
          result = await selectQuery.single()
        } else {
          result = await selectQuery
        }
        break
      case 'insert':
        result = await dbQuery.insert(data).select()
        break
      case 'update':
        let updateQuery = dbQuery.update(data.values)
        if (data.eq) {
          for (const [key, value] of Object.entries(data.eq)) {
            updateQuery = updateQuery.eq(key, value)
          }
        }
        result = await updateQuery.select()
        break
      case 'upsert':
        result = await dbQuery.upsert(data).select()
        break
      case 'delete':
        let deleteQuery = dbQuery.delete()
        if (data.eq) {
          for (const [key, value] of Object.entries(data.eq)) {
            deleteQuery = deleteQuery.eq(key, value)
          }
        }
        if (data.in) {
           for (const [key, value] of Object.entries(data.in)) {
            deleteQuery = deleteQuery.in(key, value as any[])
          }
        }
        result = await deleteQuery
        break
      case 'rpc':
        result = await supabase.rpc(data.name, data.params)
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 400 })
    }

    return NextResponse.json({ data: result.data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'An error occurred' }, { status: 500 })
  }
}
