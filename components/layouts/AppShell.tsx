'use client'

import { useState, useEffect, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sun, Moon, Plus, List, BarChart3 } from 'lucide-react'

interface AppShellProps {
  children: ReactNode
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('darkMode')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const initialDark = stored === 'dark' || (stored === null && prefersDark)
    setIsDark(initialDark)
    if (initialDark) {
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleDark = () => {
    const newMode = !isDark
    setIsDark(newMode)
    localStorage.setItem('darkMode', newMode ? 'dark' : 'light')
    if (newMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const navItems = [
    { href: '/', icon: Plus, label: 'Add' },
    { href: '/tips', icon: List, label: 'Tips' },
    { href: '/insights', icon: BarChart3, label: 'Insights' },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="flex h-14 items-center justify-between px-4">
          <h2 className="text-lg font-semibold text-card-foreground">Tip Tracker</h2>
          <button
            onClick={toggleDark}
            className="flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-accent min-h-[44px] min-w-[44px]"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {mounted ? (
              isDark ? (
                <Sun className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Moon className="h-5 w-5 text-muted-foreground" />
              )
            ) : (
              <div className="h-5 w-5" />
            )}
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 pb-20">
        <div className="mx-auto max-w-2xl px-4 py-6">
          {children}
        </div>
      </main>

      {/* Bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 safe-area-bottom">
        <div className="flex h-16 items-center justify-around">
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-1 rounded-lg px-4 py-2 transition-colors min-h-[44px] min-w-[44px] ${
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
