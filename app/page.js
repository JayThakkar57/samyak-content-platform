'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

function Home() {
  const router = useRouter()
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('samyak_token') : null
    const role = typeof window !== 'undefined' ? localStorage.getItem('samyak_role') : null
    if (!token) { router.replace('/login'); return }
    if (role === 'admin') router.replace('/admin')
    else router.replace('/dashboard')
  }, [router])
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  )
}

export default Home
