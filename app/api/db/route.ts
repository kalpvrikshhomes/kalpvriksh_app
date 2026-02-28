import { supabaseServer as supabase } from '@/lib/supabaseServer'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const { table, action, data } = await request.json()

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
        if (data?.in) {
           for (const [key, value] of Object.entries(data.in)) {
            selectQuery = selectQuery.in(key, value as any[])
          }
        }
        if (data?.order) {
            selectQuery = selectQuery.order(data.order.column, { ascending: data.order.ascending })
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
        result = await dbQuery.update(data.values).eq(Object.keys(data.eq)[0], Object.values(data.eq)[0]).select()
        break
      
      case 'upsert':
        result = await dbQuery.upsert(data).select()
        break
      
      case 'delete':
        result = await dbQuery.delete().eq(Object.keys(data.eq)[0], Object.values(data.eq)[0])
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
