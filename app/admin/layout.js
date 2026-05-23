'use client'
import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { LayoutDashboard, BookOpen, Users, LogOut, Loader2, Settings, Sparkles } from 'lucide-react'
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

  const logout = () => { localStorage.clear(); router.push('/login') }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-mesh-1"><Loader2 className="h-10 w-10 animate-spin text-blue-600" /></div>
  if (!user) return null

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/programs', label: 'Programs', icon: BookOpen },
    { href: '/admin/students', label: 'Students', icon: Users },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-mesh-1 flex">
      <aside className="w-64 glass border-r border-slate-200/60 flex flex-col sticky top-0 h-screen z-10">
        <div className="h-20 px-5 flex items-center gap-3 border-b border-slate-200/60">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500/30 blur-md" />
            <img src="/samyak-logo.png" alt="Samyak" className="relative h-11 w-11 rounded-lg object-cover" />
          </div>
          <div>
            <div className="font-display font-bold text-slate-900 text-lg leading-none">SaMyaK</div>
            <div className="text-[10px] text-blue-600 uppercase tracking-wider font-medium mt-0.5">Admin Panel</div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item, i) => {
            const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
            return (
              <motion.div key={item.href} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <Link href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${active ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm border border-blue-100' : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'}`}>
                  <item.icon className="h-4 w-4" />{item.label}
                  {active && <Sparkles className="h-3 w-3 ml-auto text-blue-500" />}
                </Link>
              </motion.div>
            )
          })}
        </nav>
        <div className="p-3 border-t border-slate-200/60">
          <div className="flex items-center gap-2 px-2 py-2">
            <div className="h-9 w-9 rounded-full bg-gradient-brand flex items-center justify-center text-sm font-bold text-white shadow-md">{user.name?.[0]?.toUpperCase() || 'A'}</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-slate-900 truncate">{user.name}</div>
              <div className="text-xs text-slate-500 truncate">{user.email}</div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={logout} className="w-full justify-start text-slate-600 mt-1 hover:bg-rose-50 hover:text-rose-600"><LogOut className="h-4 w-4 mr-2" />Sign out</Button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
