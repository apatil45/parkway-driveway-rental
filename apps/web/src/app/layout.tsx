import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ToastProvider } from '@/components/ui/Toast'
import { ErrorBoundary } from '@/components/ErrorBoundary'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Parkway - Driveway Rental Platform',
  description: 'Find and rent driveways near you. List your driveway and earn money.',
  keywords: 'driveway rental, parking, driveway sharing, parking space',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    title: 'Parkway - Driveway Rental Platform',
    description: 'Find and rent driveways near you. List your driveway and earn money.',
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
      <body className={`${inter.className} antialiased` }>
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
