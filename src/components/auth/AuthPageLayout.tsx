// components/auth/AuthPageLayout.tsx
'use client'

import { ThemeToggle} from '@/components/theme/ThemeToggle'

export function AuthPageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 relative">
      {/* Theme toggle in top right */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      {children}
    </div>
  )
}