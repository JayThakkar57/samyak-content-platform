'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { LogOut, Loader2, BookOpen, Layers, FolderOpen, FileText, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

const api = async (path, opts={}) => {
  const token = localStorage.getItem('samyak_token')
  const headers = { 'Content-Type':'application/json', Authorization:`Bearer ${token}` }
  const res = await fetch(`/api${path}`, { ...opts, headers })
  const data = await res.json().catch(()=>({}))
  if (!res.ok) throw new Error(data.error || 'Error')
  return data
}

function StudentDashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [programs, setPrograms] = useState([])
  const [loading, setLoading] = useState(true)
  const greeting = (()=>{ const h = new Date().getHours(); if (h<12) return 'Good morning'; if (h<17) return 'Good afternoon'; return 'Good evening' })()

  useEffect(() => {
    (async () => {
      try {
        const u = await api('/auth/me')
        if (u.user.role === 'admin') { router.replace('/admin'); return }
        setUser(u.user)
        setPrograms(await api('/programs'))
      } catch { router.replace('/login') }
      finally { setLoading(false) }
    })()
  }, [router])

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-canvas"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
  if (!user) return null

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/60">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <img src="/samyak-logo.png" alt="Samyak" className="h-9 w-9 rounded-lg object-cover" />
            <div>
              <div className="font-display font-bold text-slate-900 text-[15px] leading-none">Samyak Computer Classes</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Surat</div>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <div className="text-sm text-right hidden sm:block">
              <div className="font-medium text-slate-900">{user.name || 'Student'}</div>
              <div className="text-xs text-slate-500">{user.email}</div>
            </div>
            <div className="h-9 w-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-semibold text-sm">{(user.name?.[0] || 'S').toUpperCase()}</div>
            <Button size="sm" variant="ghost" onClick={()=>{localStorage.clear(); router.push('/login')}} className="text-slate-500 hover:text-slate-900"><LogOut className="h-4 w-4" /></Button>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-5xl mx-auto w-full px-6 py-12">
        <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ duration: 0.5 }} className="mb-12">
          <p className="text-sm text-slate-500 mb-2">{greeting}</p>
          <h1 className="font-display text-4xl font-bold tracking-tight text-slate-900">Welcome, {user.name?.split(' ')[0] || 'Student'}</h1>
          <p className="text-slate-600 mt-2">Your assigned programs are listed below. Pick up where you left off.</p>
        </motion.div>

        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay: 0.1, duration: 0.5 }}>
          <div className="flex items-end justify-between mb-5">
            <h2 className="font-display text-lg font-semibold text-slate-900">My Programs</h2>
            <p className="text-xs text-slate-500">{programs.length} {programs.length === 1 ? 'program' : 'programs'}</p>
          </div>

          {programs.length === 0 ? (
            <div className="card-elegant rounded-xl p-12 text-center">
              <BookOpen className="h-10 w-10 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-900 font-medium">No programs assigned yet</p>
              <p className="text-sm text-slate-500 mt-1">Please contact your instructor for access.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {programs.map((p, i) => (
                <motion.div key={p.id} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay: 0.15 + i*0.05, duration: 0.4 }}>
                  <Link href={`/dashboard/programs/${p.id}`} className="block group">
                    <div className="card-elegant lift-card rounded-xl p-6">
                      <div className="flex items-start justify-between mb-4">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">{p.category}</span>
                        <div className="h-8 w-8 rounded-lg bg-slate-100 group-hover:bg-slate-900 transition flex items-center justify-center">
                          <ArrowRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-white transition" />
                        </div>
                      </div>
                      <h3 className="font-display font-bold text-slate-900 text-xl leading-tight">{p.title}</h3>
                      <p className="text-sm text-slate-600 mt-2 line-clamp-2 min-h-[40px]">{p.description || 'Start learning today.'}</p>
                      <div className="flex items-center gap-4 mt-5 pt-5 border-t border-slate-100 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1.5"><Layers className="h-3 w-3" />{p.module_count} {p.module_count===1?'module':'modules'}</span>
                        <span className="inline-flex items-center gap-1.5"><FolderOpen className="h-3 w-3" />{p.chapter_count} {p.chapter_count===1?'chapter':'chapters'}</span>
                        <span className="inline-flex items-center gap-1.5"><FileText className="h-3 w-3" />{p.lesson_count} {p.lesson_count===1?'lesson':'lessons'}</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      <footer className="border-t border-slate-200/60 bg-white/50 py-6">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-slate-500">
          <span>© {new Date().getFullYear()} Samyak Computer Classes — Surat</span>
          <span>Built with care by Samyak Computer Classes Surat</span>
        </div>
      </footer>
    </div>
  )
}
export default StudentDashboard
