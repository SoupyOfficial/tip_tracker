'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

export default function ThemeToggleButton() {
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('darkMode')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const initialDark = stored === 'dark' || (stored === null && prefersDark)

    setIsDark(initialDark)
    document.documentElement.classList.toggle('dark', initialDark)
  }, [])

  const toggleDark = () => {
    const nextMode = !isDark

    setIsDark(nextMode)
    localStorage.setItem('darkMode', nextMode ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', nextMode)
  }

  return (
    <button
      type="button"
      onClick={toggleDark}
      className="flex w-full items-center justify-between rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span>Appearance</span>
      {mounted ? (
        isDark ? <Sun className="h-5 w-5 text-muted-foreground" /> : <Moon className="h-5 w-5 text-muted-foreground" />
      ) : (
        <div className="h-5 w-5" />
      )}
    </button>
  )
}