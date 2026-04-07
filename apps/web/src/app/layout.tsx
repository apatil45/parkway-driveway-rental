import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans, Inter } from 'next/font/google'
import './globals.css'
import { ToastProvider } from '@/components/ui/Toast'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import Analytics from '@/components/Analytics'

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: 'Parkway Spot - Driveway Rental Platform',
  description: 'Find and rent driveways near you. List your driveway and earn money. Parkway Spot.',
  keywords: 'driveway rental, parking, driveway sharing, parking space',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    title: 'Parkway Spot - Driveway Rental Platform',
    description: 'Find and rent driveways near you. List your driveway and earn money. Parkway Spot.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${plusJakarta.variable} ${inter.variable} font-sans antialiased`}>
        <Analytics />
        <ErrorBoundary>
          <ToastProvider>
            <div className="min-h-screen bg-[color:rgb(var(--color-surface))] text-[color:rgb(var(--color-surface-foreground))]">
              {children}
            </div>
          </ToastProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
