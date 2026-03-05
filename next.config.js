const isDev = process.env.NODE_ENV === 'development'

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // Enabled optimization for better performance in production
    localPatterns: [
      {
        pathname: '/api/proxy-image',
        search: '?**',
      },
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'atzrfldrqyvjyuvnhkvb.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

// Conditionally load and apply next-pwa only in non-development environments
module.exports = isDev
  ? nextConfig
  : require('next-pwa')({
      dest: 'public',
      register: true,
      skipWaiting: true,
    })(nextConfig)