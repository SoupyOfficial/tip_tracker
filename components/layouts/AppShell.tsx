'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Plus, List, Home, Settings } from 'lucide-react'

interface AppShellProps {
  children: ReactNode
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [addMode, setAddMode] = useState<'quick' | 'full'>('quick')

  useEffect(() => {
    const stored = localStorage.getItem('darkMode')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const initialDark = stored === 'dark' || (stored === null && prefersDark)
    document.documentElement.classList.toggle('dark', initialDark)
  }, [])

  const isAddPage = pathname.startsWith('/add')

  useEffect(() => {
    if (!isAddPage) return

    const syncAddMode = () => {
      const currentMode = new URL(window.location.href).searchParams.get('mode') === 'full'
        ? 'full'
        : 'quick'
      setAddMode(currentMode)
    }

    syncAddMode()
    window.addEventListener('popstate', syncAddMode)

    return () => window.removeEventListener('popstate', syncAddMode)
  }, [isAddPage])

  const handleHeaderAction = () => {
    const newMode = addMode === 'quick' ? 'full' : 'quick'
    router.push(`/add?mode=${newMode}`)
  }

  const navItems = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/add', icon: Plus, label: 'Add' },
    { href: '/tips', icon: List, label: 'Tips' },
    { href: '/settings', icon: Settings, label: 'Settings' },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/60 pt-[env(safe-area-inset-top)]">
        <div className="flex h-14 items-center justify-between px-4">
          <h2 className="text-lg font-semibold text-card-foreground">Tip Tracker</h2>
          {isAddPage && (
            <button
              type="button"
              onClick={handleHeaderAction}
              className="flex h-11 min-h-11 items-center rounded-full border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              aria-label={`Switch to ${addMode === 'quick' ? 'full' : 'quick'} form`}
            >
              {addMode === 'quick' ? 'Full Form' : 'Quick Add'}
            </button>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 pt-3 pb-[calc(6rem+env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-2xl px-4">
          {children}
        </div>
      </main>

      {/* Bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/60 safe-area-bottom">
        <div className="flex h-16 items-center justify-around">
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`flex min-h-11 min-w-11 flex-col items-center gap-1 rounded-lg px-4 py-2 transition-colors ${
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
