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
    icon: [
      {
        url: '/icon.png',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <link rel="manifest" href="/manifest.json" />
      <meta name="theme-color" content="#0f172a" />
      <body className={inter.className}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
