'use client'
import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, BookOpen, Users, LogOut, Loader2, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const apiFetch = async (path, opts = {}) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('samyak_token') : null
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`/api${path}`, { ...opts, headers })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
  return data
}

export default function AdminLayout({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch('/auth/me')
        if (data.user.role !== 'admin') { router.replace('/dashboard'); return }
        setUser(data.user)
      } catch { router.replace('/login') }
      finally { setLoading(false) }
    })()
  }, [router])

  const logout = () => { localStorage.clear(); router.push('/login') }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-canvas"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
  if (!user) return null

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/programs', label: 'Programs', icon: BookOpen },
    { href: '/admin/students', label: 'Students', icon: Users },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-canvas flex">
      <aside className="w-60 bg-white border-r border-slate-200/60 flex flex-col sticky top-0 h-screen">
        <div className="h-16 px-5 flex items-center gap-2.5 border-b border-slate-200/60">
          <img src="/samyak-logo.png" alt="Samyak" className="h-9 w-9 rounded-lg object-cover" />
          <div className="min-w-0">
            <div className="font-display font-bold text-slate-900 text-[13px] leading-tight truncate">Samyak Computer</div>
            <div className="text-[10px] text-slate-500">Classes — Surat</div>
          </div>
        </div>
        <nav className="flex-1 p-2.5 space-y-0.5">
          {navItems.map(item => {
            const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition ${active ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
                <item.icon className="h-4 w-4" />{item.label}
              </Link>
            )
          })}
        </nav>
        <div className="p-2.5 border-t border-slate-200/60">
          <div className="flex items-center gap-2.5 px-2 py-2">
            <div className="h-8 w-8 rounded-full bg-slate-900 flex items-center justify-center text-sm font-semibold text-white">{user.name?.[0]?.toUpperCase() || 'A'}</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-900 truncate">{user.name}</div>
              <div className="text-xs text-slate-500 truncate">{user.email}</div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={logout} className="w-full justify-start text-slate-500 mt-1 hover:bg-rose-50 hover:text-rose-600 h-8"><LogOut className="h-3.5 w-3.5 mr-2" />Sign out</Button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
