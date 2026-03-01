import type { Metadata } from 'next'
import { Inter } from "next/font/google";
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const inter = Inter({ subsets: ["latin"],});


export const metadata: Metadata = {
  title: 'Interior Manager - Inventory & Projects',
  description: 'Professional inventory and project management system for interior design companies',
  generator: 'v0.app',
  icons: {
    icon: '/icon.png?v=2',
    apple: '/apple-icon.png?v=2',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/icon.png?v=2" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-icon.png?v=2" />
      </head>
      <link rel="manifest" href="/manifest.json" />
      <meta name="theme-color" content="#0f172a" />
      <body className={inter.className}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
