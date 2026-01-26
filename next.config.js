const isDev = process.env.NODE_ENV === 'development'

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
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