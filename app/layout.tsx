import type { Metadata, Viewport } from 'next'
import { Manrope } from 'next/font/google'
import './globals.css'

const manrope = Manrope({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-manrope',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'МБА-МАИ · Manager 360',
  description: 'Система управления баскетбольным клубом МБА-МАИ',
  manifest: '/manifest.json',
  icons: { icon: '/favicon.ico', apple: '/apple-icon.png' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0e0f13',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={manrope.variable}>
      <body className="bg-bg text-white antialiased">{children}</body>
    </html>
  )
}
