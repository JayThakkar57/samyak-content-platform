'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, ChevronDown, ChevronRight, FileText, ArrowLeft, Menu, X, Clock, Sparkles, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Renderer } from '@/components/notion-renderer'

const api = async (path, opts={}) => {
  const token = localStorage.getItem('samyak_token')
  const res = await fetch(`/api${path}`, { ...opts, headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` } })
  const data = await res.json().catch(()=>({}))
  if (!res.ok) throw new Error(data.error || 'Error')
  return data
}

function StudentProgramView() {
  const { id } = useParams()
  const router = useRouter()
  const [program, setProgram] = useState(null)
  const [activeLesson, setActiveLesson] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lessonLoading, setLessonLoading] = useState(false)
  const [expanded, setExpanded] = useState({})
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const contentRef = useRef(null)

  // Reading progress
  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement
      const scrollTop = el.scrollTop || document.body.scrollTop
      const scrollHeight = el.scrollHeight - el.clientHeight
      const p = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0
      setProgress(p)
      setShowScrollTop(scrollTop > 400)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [activeLesson])

  useEffect(() => {
    (async () => {
      try {
        const p = await api(`/programs/${id}`)
        setProgram(p)
        const exp = {}
        if (p.modules[0]) { exp[p.modules[0].id] = true; if (p.modules[0].chapters[0]) exp[p.modules[0].chapters[0].id] = true }
        setExpanded(exp)
        const firstLesson = p.modules.flatMap(m=>m.chapters.flatMap(c=>c.lessons))[0]
        if (firstLesson) loadLesson(firstLesson.id)
      } catch { router.replace('/dashboard') }
      finally { setLoading(false) }
    })()
  }, [id, router])

  const allLessons = program?.modules.flatMap(m => m.chapters.flatMap(c => c.lessons.map(l => ({ ...l, chapter: c, module: m })))) || []
  const currentIdx = activeLesson ? allLessons.findIndex(l => l.id === activeLesson.id) : -1
  const prevLesson = currentIdx > 0 ? allLessons[currentIdx - 1] : null
  const nextLesson = currentIdx >= 0 && currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null

  const loadLesson = async (lid) => {
    setLessonLoading(true)
    try {
      const l = await api(`/lessons/${lid}`)
      setActiveLesson(l)
      setSidebarOpen(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (e) { console.error(e) }
    finally { setLessonLoading(false) }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-mesh-1"><Loader2 className="h-10 w-10 animate-spin text-blue-600" /></div>
  if (!program) return null

  const SidebarContent = ({ mobile = false }) => (
    <>
      <div className="px-5 py-5 border-b border-slate-200/60">
        <Link href="/dashboard" className="text-xs text-slate-500 hover:text-blue-600 inline-flex items-center gap-1 mb-3 transition"><ArrowLeft className="h-3 w-3" />All programs</Link>
        <div className="flex items-center gap-3">
          <img src="/samyak-logo.png" alt="Samyak" className="h-9 w-9 rounded-lg object-cover" />
          <div className="min-w-0">
            <div className="font-display font-bold text-slate-900 leading-tight truncate">{program.title}</div>
            <div className="text-[10px] text-blue-600 uppercase tracking-wider font-medium">{program.category}</div>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-3 space-y-1">
        {program.modules.map((m, mi) => (
          <motion.div key={m.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: mi * 0.05 }}>
            <button onClick={()=>setExpanded(e=>({...e,[m.id]:!e[m.id]}))} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-slate-800 hover:bg-white/80 transition">
              <span className={`transition-transform ${expanded[m.id] ? 'rotate-90' : ''}`}><ChevronRight className="h-3.5 w-3.5" /></span>
              <span className="flex-1 text-left">{m.title}</span>
            </button>
            <AnimatePresence>
              {expanded[m.id] && (
                <motion.div initial={{height:0, opacity:0}} animate={{height:'auto', opacity:1}} exit={{height:0, opacity:0}} transition={{duration:0.2}} className="overflow-hidden">
                  {m.chapters.map(c => (
                    <div key={c.id} className="ml-3">
                      <button onClick={()=>setExpanded(e=>({...e,[c.id]:!e[c.id]}))} className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-slate-700 hover:bg-white/60 transition">
                        <span className={`transition-transform ${expanded[c.id] ? 'rotate-90' : ''}`}><ChevronRight className="h-3 w-3" /></span>
                        <span className="flex-1 text-left text-[13px]">{c.title}</span>
                      </button>
                      <AnimatePresence>
                        {expanded[c.id] && (
                          <motion.div initial={{height:0, opacity:0}} animate={{height:'auto', opacity:1}} exit={{height:0, opacity:0}} transition={{duration:0.2}} className="overflow-hidden">
                            {c.lessons.map(l => (
                              <button key={l.id} onClick={()=>loadLesson(l.id)} className={`w-full flex items-center gap-2 ml-5 px-3 py-1.5 rounded-md text-[13px] text-left transition ${activeLesson?.id===l.id ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 font-medium border-l-2 border-blue-500' : 'text-slate-600 hover:bg-white/60'}`}>
                                <FileText className="h-3 w-3 shrink-0" /><span className="truncate">{l.title}</span>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-mesh-1 flex relative">
      <div className="reading-progress" style={{ width: `${progress}%` }} />

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-80 glass border-r border-slate-200/60 flex-col sticky top-0 h-screen z-10"><SidebarContent /></aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={()=>setSidebarOpen(false)}>
            <motion.aside initial={{ x:-300 }} animate={{ x:0 }} exit={{ x:-300 }} transition={{ type:'spring', damping:25 }} className="w-80 bg-white h-full flex flex-col shadow-2xl" onClick={e=>e.stopPropagation()}><SidebarContent mobile /></motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 min-w-0 relative">
        {/* Mobile header */}
        <div className="md:hidden sticky top-0 glass border-b border-slate-200/60 px-4 h-14 flex items-center gap-3 z-40">
          <Button size="icon" variant="ghost" onClick={()=>setSidebarOpen(true)}><Menu className="h-5 w-5" /></Button>
          <div className="font-display font-semibold text-slate-900 truncate">{activeLesson?.title || program.title}</div>
        </div>

        <div className="max-w-3xl mx-auto px-6 md:px-12 py-12 md:py-16" ref={contentRef}>
          {!activeLesson ? (
            <div className="text-center py-20">
              <Sparkles className="h-12 w-12 mx-auto text-blue-300 mb-3" />
              <p className="text-slate-500">Select a lesson from the sidebar to begin</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.article key={activeLesson.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                {/* Lesson header */}
                <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }} className="mb-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium mb-4">
                    <Sparkles className="h-3 w-3" />Lesson
                  </div>
                  <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-slate-900 leading-[1.1]">{activeLesson.title}</h1>
                  {activeLesson.last_synced_at && (
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-4">
                      <Clock className="h-3 w-3" />Updated {new Date(activeLesson.last_synced_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                  )}
                </motion.div>

                {lessonLoading ? (
                  <div className="py-20 text-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" /></div>
                ) : !activeLesson.content_json ? (
                  <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} className="p-8 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 text-amber-900">
                    <p className="font-display font-semibold text-lg">Content coming soon ✨</p>
                    <p className="text-sm mt-2 text-amber-700">This lesson hasn't been published yet. Please check back later.</p>
                  </motion.div>
                ) : (
                  <div className="prose-lesson">
                    <Renderer blocks={activeLesson.content_json} />
                  </div>
                )}

                {/* Nav between lessons */}
                {(prevLesson || nextLesson) && !lessonLoading && (
                  <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay: 0.3 }} className="mt-16 pt-8 border-t border-slate-200 grid grid-cols-2 gap-4">
                    {prevLesson ? (
                      <button onClick={()=>loadLesson(prevLesson.id)} className="group text-left p-5 rounded-xl border border-slate-200 hover:border-blue-300 bg-white lift-on-hover">
                        <div className="text-xs text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><ArrowLeft className="h-3 w-3" />Previous</div>
                        <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition truncate">{prevLesson.title}</div>
                      </button>
                    ) : <div />}
                    {nextLesson ? (
                      <button onClick={()=>loadLesson(nextLesson.id)} className="group text-right p-5 rounded-xl border border-slate-200 hover:border-blue-300 bg-white lift-on-hover">
                        <div className="text-xs text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1 justify-end">Next<ChevronRight className="h-3 w-3" /></div>
                        <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition truncate">{nextLesson.title}</div>
                      </button>
                    ) : <div />}
                  </motion.div>
                )}
              </motion.article>
            </AnimatePresence>
          )}
        </div>

        {/* Scroll to top */}
        <AnimatePresence>
          {showScrollTop && (
            <motion.button initial={{ opacity:0, scale:0.5 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.5 }}
              onClick={()=>window.scrollTo({top:0, behavior:'smooth'})}
              className="fixed bottom-6 right-6 h-12 w-12 rounded-full bg-gradient-brand text-white shadow-xl shadow-blue-500/30 flex items-center justify-center z-50 hover:scale-110 transition">
              <ChevronUp className="h-5 w-5" />
            </motion.button>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
export default StudentProgramView
