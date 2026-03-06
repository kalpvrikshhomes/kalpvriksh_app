import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getProxyImageUrl(pathOrUrl: string | null | undefined): string {
  if (!pathOrUrl) return '/placeholder.svg'
  
  // If it's a "broken" proxy URL (missing ?) fix it
  if (pathOrUrl.startsWith('/api/proxy-image') && !pathOrUrl.includes('?')) {
    const parts = pathOrUrl.split('/api/proxy-image')
    if (parts.length > 1) {
      const rest = parts[1]
      if (rest.startsWith('path=')) return `/api/proxy-image?${rest}`
      if (rest.startsWith('url=')) return `/api/proxy-image?${rest}`
      return `/api/proxy-image?path=${encodeURIComponent(rest)}`
    }
  }

  // If it's already a correctly proxied URL, return it
  if (pathOrUrl.startsWith('/api/proxy-image')) {
    return pathOrUrl
  }

  // If it's a relative path (doesn't start with http or /)
  // Assuming relative paths should be proxied by path
  if (!pathOrUrl.startsWith('http') && !pathOrUrl.startsWith('/')) {
    return `/api/proxy-image?path=${encodeURIComponent(pathOrUrl)}`
  }

  // If it's a full Supabase URL, extract the path and proxy it
  if (pathOrUrl.includes('.supabase.co/storage/v1/object/public/')) {
    const parts = pathOrUrl.split('/storage/v1/object/public/')
    if (parts.length > 1) {
      return `/api/proxy-image?path=${encodeURIComponent(parts[1])}`
    }
  }

  // If it's another Supabase URL or any other URL we want to proxy
  if (pathOrUrl.startsWith('http')) {
     return `/api/proxy-image?url=${encodeURIComponent(pathOrUrl)}`
  }

  return pathOrUrl
}

/**
 * Extracts the storage path (including bucket) from a direct Supabase URL or a proxied URL.
 * Returns null if the path cannot be extracted.
 */
export function extractStoragePath(url: string | null | undefined): { bucket: string; path: string } | null {
  if (!url) return null;

  let fullPath = '';

  if (url.startsWith('/api/proxy-image')) {
    const searchParams = new URL(url, window.location.origin).searchParams;
    const pathParam = searchParams.get('path');
    if (pathParam) {
      fullPath = pathParam;
    } else {
      const urlParam = searchParams.get('url');
      if (urlParam) {
        return extractStoragePath(urlParam);
      }
    }
  } else if (url.includes('.supabase.co/storage/v1/object/public/')) {
    const parts = url.split('/storage/v1/object/public/');
    if (parts.length > 1) {
      fullPath = parts[1];
    }
  }

  if (fullPath) {
    const parts = fullPath.split('/');
    if (parts.length > 1) {
      return {
        bucket: parts[0],
        path: parts.slice(1).join('/')
      };
    }
  }

  return null;
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
