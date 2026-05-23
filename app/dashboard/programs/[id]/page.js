'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, ChevronRight, FileText, ArrowLeft, Menu, Clock, ChevronUp } from 'lucide-react'
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

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-canvas"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
  if (!program) return null

  const SidebarContent = () => (
    <>
      <div className="px-5 py-5 border-b border-slate-200/60">
        <Link href="/dashboard" className="text-xs text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 mb-3 transition"><ArrowLeft className="h-3 w-3" />All programs</Link>
        <div className="flex items-center gap-2.5">
          <img src="/samyak-logo.png" alt="Samyak" className="h-9 w-9 rounded-lg object-cover" />
          <div className="min-w-0">
            <div className="font-display font-bold text-slate-900 leading-tight text-sm truncate">{program.title}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">{program.category}</div>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-2.5 space-y-0.5">
        {program.modules.map(m => (
          <div key={m.id}>
            <button onClick={()=>setExpanded(e=>({...e,[m.id]:!e[m.id]}))} className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold text-slate-800 hover:bg-slate-100 transition">
              <span className={`transition-transform text-slate-400 ${expanded[m.id] ? 'rotate-90' : ''}`}><ChevronRight className="h-3.5 w-3.5" /></span>
              <span className="flex-1 text-left">{m.title}</span>
            </button>
            <AnimatePresence>
              {expanded[m.id] && (
                <motion.div initial={{height:0, opacity:0}} animate={{height:'auto', opacity:1}} exit={{height:0, opacity:0}} transition={{duration:0.15}} className="overflow-hidden">
                  {m.chapters.map(c => (
                    <div key={c.id} className="ml-3">
                      <button onClick={()=>setExpanded(e=>({...e,[c.id]:!e[c.id]}))} className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-[13px] text-slate-600 hover:bg-slate-100 transition">
                        <span className={`transition-transform text-slate-400 ${expanded[c.id] ? 'rotate-90' : ''}`}><ChevronRight className="h-3 w-3" /></span>
                        <span className="flex-1 text-left">{c.title}</span>
                      </button>
                      <AnimatePresence>
                        {expanded[c.id] && (
                          <motion.div initial={{height:0, opacity:0}} animate={{height:'auto', opacity:1}} exit={{height:0, opacity:0}} transition={{duration:0.15}} className="overflow-hidden">
                            {c.lessons.map(l => (
                              <button key={l.id} onClick={()=>loadLesson(l.id)} className={`w-full flex items-center gap-2 ml-5 px-3 py-1.5 rounded-md text-[13px] text-left transition ${activeLesson?.id===l.id ? 'bg-slate-900 text-white font-medium' : 'text-slate-600 hover:bg-slate-100'}`}>
                                <FileText className="h-3 w-3 shrink-0 opacity-60" /><span className="truncate">{l.title}</span>
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
          </div>
        ))}
      </div>
      <div className="px-5 py-3 border-t border-slate-200/60 text-[10px] text-slate-400">
        Samyak Computer Classes — Surat
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-canvas flex relative">
      <div className="reading-progress" style={{ width: `${progress}%` }} />

      <aside className="hidden md:flex w-72 bg-white border-r border-slate-200/60 flex-col sticky top-0 h-screen z-10"><SidebarContent /></aside>

      <AnimatePresence>
        {sidebarOpen && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="md:hidden fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" onClick={()=>setSidebarOpen(false)}>
            <motion.aside initial={{ x:-280 }} animate={{ x:0 }} exit={{ x:-280 }} transition={{ type:'spring', damping:30, stiffness: 300 }} className="w-72 bg-white h-full flex flex-col shadow-xl" onClick={e=>e.stopPropagation()}><SidebarContent /></motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 min-w-0 relative">
        <div className="md:hidden sticky top-0 bg-white/90 backdrop-blur-md border-b border-slate-200/60 px-4 h-14 flex items-center gap-3 z-40">
          <Button size="icon" variant="ghost" onClick={()=>setSidebarOpen(true)} className="h-8 w-8"><Menu className="h-4 w-4" /></Button>
          <div className="font-display font-semibold text-slate-900 truncate text-sm">{activeLesson?.title || program.title}</div>
        </div>

        <div className="max-w-2xl mx-auto px-6 md:px-10 py-12 md:py-16">
          {!activeLesson ? (
            <div className="text-center py-20 text-slate-400">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Select a lesson from the sidebar to begin</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.article key={activeLesson.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                <div className="mb-10">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-3">Lesson</p>
                  <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-slate-900 leading-tight">{activeLesson.title}</h1>
                  {activeLesson.last_synced_at && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-4">
                      <Clock className="h-3 w-3" />Updated {new Date(activeLesson.last_synced_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                  )}
                </div>

                {lessonLoading ? (
                  <div className="py-20 text-center"><Loader2 className="h-6 w-6 animate-spin text-slate-400 mx-auto" /></div>
                ) : !activeLesson.content_json ? (
                  <div className="p-6 rounded-xl bg-stone-50 border border-stone-200 text-stone-700">
                    <p className="font-display font-semibold">Content coming soon</p>
                    <p className="text-sm mt-1 text-stone-600">This lesson hasn't been published yet. Please check back later.</p>
                  </div>
                ) : (
                  <div className="prose-lesson">
                    <Renderer blocks={activeLesson.content_json} />
                  </div>
                )}

                {(prevLesson || nextLesson) && !lessonLoading && (
                  <div className="mt-16 pt-8 border-t border-slate-200 grid grid-cols-2 gap-3">
                    {prevLesson ? (
                      <button onClick={()=>loadLesson(prevLesson.id)} className="group text-left p-4 rounded-lg border border-slate-200 hover:border-slate-400 bg-white transition">
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><ArrowLeft className="h-3 w-3" />Previous</div>
                        <div className="font-medium text-slate-900 text-sm truncate">{prevLesson.title}</div>
                      </button>
                    ) : <div />}
                    {nextLesson ? (
                      <button onClick={()=>loadLesson(nextLesson.id)} className="group text-right p-4 rounded-lg border border-slate-200 hover:border-slate-400 bg-white transition">
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1 justify-end">Next<ChevronRight className="h-3 w-3" /></div>
                        <div className="font-medium text-slate-900 text-sm truncate">{nextLesson.title}</div>
                      </button>
                    ) : <div />}
                  </div>
                )}

                <footer className="mt-16 pt-8 border-t border-slate-100 text-center text-xs text-slate-400">
                  © {new Date().getFullYear()} Samyak Computer Classes — Surat
                </footer>
              </motion.article>
            </AnimatePresence>
          )}
        </div>

        <AnimatePresence>
          {showScrollTop && (
            <motion.button initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:10 }}
              onClick={()=>window.scrollTo({top:0, behavior:'smooth'})}
              className="fixed bottom-6 right-6 h-10 w-10 rounded-full bg-slate-900 text-white shadow-lg flex items-center justify-center z-50 hover:bg-slate-800 transition">
              <ChevronUp className="h-4 w-4" />
            </motion.button>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
export default StudentProgramView
