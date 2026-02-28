import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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
