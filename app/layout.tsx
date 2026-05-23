import type { ReactNode } from 'react'
import type { Metadata, Viewport } from 'next'
import { Toaster } from 'sonner'
import FeedbackButton from '@/components/shared/FeedbackButton'
import './globals.css'

export const metadata: Metadata = {
  title: 'Tip Tracker',
  description: 'Track tip income and tour quality for VIP Tour Guides',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Tip Tracker',
  },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#3b82f6' },
    { media: '(prefers-color-scheme: dark)', color: '#1e3a5f' },
  ],
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

interface RootLayoutProps {
  children: ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var mode = localStorage.getItem('darkMode');
                  if (mode === 'dark' || (mode === null && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        {children}
        <FeedbackButton />
        <Toaster position="bottom-center" closeButton richColors theme="system" />
      </body>
    </html>
  )
}
