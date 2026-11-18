'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const token = useAuthStore((s) => s.token)
  const hydrated = useAuthStore((s) => s.hydrated)
  const hydrate = useAuthStore((s) => s.hydrate)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (!hydrated) hydrate()
  }, [hydrated, hydrate])

  useEffect(() => {
    if (hydrated) {
      if (!token) router.replace('/login')
      setChecked(true)
    }
  }, [hydrated, token, router])

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Memuat sesi...
      </div>
    )
  }

  if (!token) return null
  return <>{children}</>
}