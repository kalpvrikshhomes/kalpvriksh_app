import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getProxyImageUrl(url: string | null | undefined): string {
  if (!url) return '/placeholder.svg'
  if (url.startsWith('https://atzrfldrqyvjyuvnhkvb.supabase.co')) {
    return `/api/proxy-image?url=${encodeURIComponent(url)}`
  }
  return url
}

export async function dbFetch(table: string, action: string, data: any) {
  const response = await fetch('/api/db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ table, action, data }),
  })
  const res = await response.json()
  if (res.error) {
    throw new Error(res.error)
  }
  return res.data
}
