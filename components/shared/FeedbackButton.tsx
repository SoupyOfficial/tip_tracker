'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, Bug, Lightbulb, Send, X } from 'lucide-react'
import { toast } from 'sonner'

type Category = 'Bug' | 'Feature Request' | 'Suggestion' | 'Other'

const categories: { value: Category; icon: typeof Bug; color: string }[] = [
  { value: 'Bug', icon: Bug, color: 'bg-red-500 text-white dark:bg-red-600' },
  { value: 'Feature Request', icon: Lightbulb, color: 'bg-amber-500 text-white dark:bg-amber-600' },
  { value: 'Suggestion', icon: MessageSquare, color: 'bg-blue-500 text-white dark:bg-blue-600' },
  { value: 'Other', icon: MessageSquare, color: 'bg-gray-500 text-white dark:bg-gray-600' },
]

export default function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<Category>('Suggestion')
  const [showPulse, setShowPulse] = useState(true)

  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || ''

  useEffect(() => {
    const timer = setTimeout(() => setShowPulse(false), 8000)
    return () => clearTimeout(timer)
  }, [])

  const handleSend = () => {
    if (!message.trim()) {
      toast.error('Please enter a message')
      return
    }

    if (!supportEmail) {
      toast.error('Support email is not configured')
      return
    }

    const subject = encodeURIComponent(`Tip Tracker Feedback: ${selectedCategory}`)
    const body = encodeURIComponent(message.trim())
    const mailtoUrl = `mailto:${supportEmail}?subject=${subject}&body=${body}`

    window.location.href = mailtoUrl
    toast.success('Feedback opened in Mail')
    setIsOpen(false)
    setMessage('')
    setSelectedCategory('Suggestion')
  }

  const handleCancel = () => {
    setIsOpen(false)
    setMessage('')
    setSelectedCategory('Suggestion')
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-500 text-white shadow-lg transition-all hover:bg-indigo-600 active:scale-95 dark:bg-indigo-600 dark:hover:bg-indigo-700 ${
          showPulse ? 'animate-pulse' : ''
        }`}
        style={{ bottom: '5.5rem' }}
        aria-label="Send feedback"
      >
        <MessageSquare className="h-6 w-6" />
      </button>

      {/* Modal Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={handleCancel}
        >
          {/* Modal Sheet */}
          <div
            className="absolute inset-x-0 bottom-0 animate-slide-up overflow-hidden rounded-t-2xl bg-card shadow-2xl dark:bg-card"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle Bar */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="text-lg font-semibold text-card-foreground">Send Feedback</h2>
              <button
                onClick={handleCancel}
                className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-accent"
                aria-label="Close"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-4 p-4">
              {/* Category Selector */}
              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">
                  Category
                </label>
                <div className="flex flex-wrap gap-2">
                  {categories.map(({ value, icon: Icon, color }) => (
                    <button
                      key={value}
                      onClick={() => setSelectedCategory(value)}
                      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
                        selectedCategory === value
                          ? `${color} shadow-sm`
                          : 'bg-muted text-muted-foreground hover:bg-muted/80 dark:bg-muted/50'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {value}
                    </button>
                  ))}
                </div>
              </div>

              {/* Textarea */}
              <div>
                <label
                  htmlFor="feedback-message"
                  className="mb-2 block text-sm font-medium text-muted-foreground"
                >
                  Your Feedback
                </label>
                <textarea
                  id="feedback-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="What would make Tip Tracker better? Found a bug? Have a feature idea?"
                  className="min-h-[120px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-background/50"
                  maxLength={1000}
                />
                <div className="mt-1 text-right text-xs text-muted-foreground">
                  {message.length}/1000
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleCancel}
                  className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSend}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-600 active:scale-[0.98] dark:bg-indigo-600 dark:hover:bg-indigo-700"
                >
                  <Send className="h-4 w-4" />
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Animation Styles */}
      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s cubic-bezier(0.32, 0.72, 0, 1);
        }
      `}</style>
    </>
  )
}
