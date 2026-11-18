'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'

export default function HomePage() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const hydrated = useAuthStore((s) => s.hydrated)
  const hydrate = useAuthStore((s) => s.hydrate)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!hydrated) hydrate()
  }, [hydrated, hydrate])

  useEffect(() => {
    if (hydrated) {
      if (!user) router.replace('/login')
      else if (user.role === 'CLIENT') router.replace('/client')
      else router.replace('/dashboard')
      setReady(true)
    }
  }, [hydrated, user, router])

  return (
    <div className="min-h-screen flex items-center justify-center text-slate-500">
      {ready ? 'Mengalihkan...' : 'Memuat sesi...'}
    </div>
  )
}