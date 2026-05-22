'use client'
import { useState, useEffect, createContext, useContext } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { GraduationCap, LayoutDashboard, BookOpen, Users, LogOut, Loader2 } from 'lucide-react'
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
      } catch {
        router.replace('/login')
      } finally { setLoading(false) }
    })()
  }, [router])

  const logout = () => {
    localStorage.clear()
    router.push('/login')
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
  if (!user) return null

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/programs', label: 'Programs', icon: BookOpen },
    { href: '/admin/students', label: 'Students', icon: Users },
  ]

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="h-16 px-5 flex items-center gap-2 border-b border-slate-200">
          <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center"><GraduationCap className="h-5 w-5 text-white" /></div>
          <div>
            <div className="font-bold text-slate-900">Samyak</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Admin Panel</div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => {
            const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${active ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`}>
                <item.icon className="h-4 w-4" />{item.label}
              </Link>
            )
          })}
        </nav>
        <div className="p-3 border-t border-slate-200">
          <div className="flex items-center gap-2 px-2 py-2">
            <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold">{user.name?.[0]?.toUpperCase() || 'A'}</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-900 truncate">{user.name}</div>
              <div className="text-xs text-slate-500 truncate">{user.email}</div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={logout} className="w-full justify-start text-slate-600 mt-1"><LogOut className="h-4 w-4 mr-2" />Sign out</Button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
