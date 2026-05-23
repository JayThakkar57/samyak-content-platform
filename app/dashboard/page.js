'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { GraduationCap, LogOut, Loader2, BookOpen, Layers, FolderOpen, FileText, Sparkles, TrendingUp, Award } from 'lucide-react'
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

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-mesh-1"><Loader2 className="h-10 w-10 animate-spin text-blue-600" /></div>
  if (!user) return null

  return (
    <div className="min-h-screen bg-mesh-1 relative overflow-hidden">
      <div className="floating-shape w-96 h-96 bg-blue-300 -top-20 -right-20 animate-float-slow" />
      <div className="floating-shape w-80 h-80 bg-violet-300 top-1/3 -left-20 animate-float-slow" style={{animationDelay:'3s'}} />

      <header className="relative z-10 glass border-b border-white/40 sticky top-0">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/40 blur-md group-hover:blur-lg transition" />
              <img src="/samyak-logo.png" alt="Samyak" className="relative h-10 w-10 rounded-lg object-cover" />
            </div>
            <div>
              <div className="font-display font-bold text-slate-900 text-lg leading-none">SaMyaK</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Learning Platform</div>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <div className="text-sm text-right hidden sm:block">
              <div className="font-semibold text-slate-900">{user.name || 'Student'}</div>
              <div className="text-xs text-slate-500">{user.email}</div>
            </div>
            <div className="h-10 w-10 rounded-full bg-gradient-brand flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/30">
              {(user.name?.[0] || 'S').toUpperCase()}
            </div>
            <Button size="sm" variant="ghost" onClick={()=>{localStorage.clear(); router.push('/login')}} className="text-slate-600 hover:bg-white/60"><LogOut className="h-4 w-4" /></Button>
          </div>
        </div>
      </header>

      <div className="relative max-w-6xl mx-auto px-6 py-12">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium mb-4">
            <Sparkles className="h-3 w-3" />{greeting}
          </div>
          <h1 className="font-display text-5xl sm:text-6xl font-bold tracking-tight text-slate-900">
            Welcome back, <span className="text-gradient-brand">{user.name?.split(' ')[0] || 'Student'}</span> 👋
          </h1>
          <p className="text-slate-600 mt-3 text-lg">Pick up where you left off — your assigned programs await.</p>
        </motion.div>

        {/* Stats strip */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.6 }} className="grid grid-cols-3 gap-4 mb-10">
          {[
            { icon: BookOpen, label: 'Programs', value: programs.length, color: 'from-blue-500 to-cyan-500' },
            { icon: Layers, label: 'Modules', value: programs.reduce((s,p)=>s+(p.module_count||0),0), color: 'from-violet-500 to-purple-500' },
            { icon: FileText, label: 'Lessons', value: programs.reduce((s,p)=>s+(p.lesson_count||0),0), color: 'from-pink-500 to-rose-500' },
          ].map((s,i) => (
            <motion.div key={s.label} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay: 0.2 + i*0.1, duration: 0.5 }} className="glass rounded-2xl p-5 lift-on-hover">
              <div className={`inline-flex h-10 w-10 rounded-xl bg-gradient-to-br ${s.color} items-center justify-center mb-3 shadow-lg`}>
                <s.icon className="h-5 w-5 text-white" />
              </div>
              <div className="text-3xl font-bold text-slate-900 font-display">{s.value}</div>
              <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">{s.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Programs */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="font-display text-2xl font-bold text-slate-900">My Programs</h2>
              <p className="text-slate-500 text-sm mt-1">Continue learning where you left off</p>
            </div>
            <Award className="h-6 w-6 text-amber-500" />
          </div>

          {programs.length === 0 ? (
            <div className="glass rounded-2xl p-16 text-center">
              <BookOpen className="h-12 w-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-700 font-medium">No programs assigned yet</p>
              <p className="text-sm text-slate-500 mt-1">Contact your admin to get access</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {programs.map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i*0.1, duration: 0.5 }}>
                  <Link href={`/dashboard/programs/${p.id}`} className="block group">
                    <div className="card-3d rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-md">
                      <div className="h-36 bg-gradient-brand relative overflow-hidden animate-gradient" style={p.thumbnail ? { backgroundImage:`url(${p.thumbnail})`, backgroundSize:'cover', backgroundPosition:'center' } : {}}>
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/80 via-indigo-600/60 to-violet-700/80" />
                        <div className="absolute inset-0 opacity-30" style={{backgroundImage:'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.3) 0%, transparent 50%)'}} />
                        <div className="relative h-full flex flex-col justify-between p-5">
                          <div className="flex justify-between items-start">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur text-white text-xs font-medium border border-white/30">{p.category}</span>
                            <TrendingUp className="h-5 w-5 text-white/80 group-hover:scale-110 transition" />
                          </div>
                          <div className="text-white">
                            <h3 className="font-display font-bold text-xl leading-tight drop-shadow-sm">{p.title}</h3>
                          </div>
                        </div>
                      </div>
                      <div className="p-5">
                        <p className="text-sm text-slate-600 line-clamp-2 min-h-[40px]">{p.description || 'Start learning today.'}</p>
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span className="inline-flex items-center gap-1"><Layers className="h-3.5 w-3.5" />{p.module_count}</span>
                            <span className="inline-flex items-center gap-1"><FolderOpen className="h-3.5 w-3.5" />{p.chapter_count}</span>
                            <span className="inline-flex items-center gap-1"><FileText className="h-3.5 w-3.5" />{p.lesson_count}</span>
                          </div>
                          <span className="text-xs font-medium text-blue-600 group-hover:translate-x-1 transition inline-flex items-center gap-1">Open →</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
export default StudentDashboard
