'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, ChevronDown, ChevronRight, FileText, ArrowLeft, GraduationCap, BookOpen, Menu, X } from 'lucide-react'
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
  const [expanded, setExpanded] = useState({})
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    (async () => {
      try {
        const p = await api(`/programs/${id}`)
        setProgram(p)
        // Auto-expand first module/chapter, select first lesson
        const exp = {}
        if (p.modules[0]) { exp[p.modules[0].id] = true; if (p.modules[0].chapters[0]) exp[p.modules[0].chapters[0].id] = true }
        setExpanded(exp)
        const firstLesson = p.modules.flatMap(m=>m.chapters.flatMap(c=>c.lessons))[0]
        if (firstLesson) loadLesson(firstLesson.id)
      } catch (e) { router.replace('/dashboard') }
      finally { setLoading(false) }
    })()
  }, [id, router])

  const loadLesson = async (lid) => {
    try { const l = await api(`/lessons/${lid}`); setActiveLesson(l); setSidebarOpen(false) } catch (e) { console.error(e) }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
  if (!program) return null

  const SidebarContent = () => (
    <>
      <div className="px-5 py-4 border-b border-slate-200">
        <Link href="/dashboard" className="text-xs text-slate-500 hover:text-blue-600 inline-flex items-center gap-1"><ArrowLeft className="h-3 w-3" />All programs</Link>
        <div className="font-bold text-slate-900 mt-2 leading-tight">{program.title}</div>
        <div className="text-xs text-blue-600 mt-0.5">{program.category}</div>
      </div>
      <div className="flex-1 overflow-auto p-3 space-y-1">
        {program.modules.map(m => (
          <div key={m.id}>
            <button onClick={()=>setExpanded(e=>({...e,[m.id]:!e[m.id]}))} className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm font-semibold text-slate-800 hover:bg-slate-100">
              {expanded[m.id]?<ChevronDown className="h-3.5 w-3.5" />:<ChevronRight className="h-3.5 w-3.5" />}
              <span className="flex-1 text-left">{m.title}</span>
            </button>
            {expanded[m.id] && m.chapters.map(c => (
              <div key={c.id} className="ml-3">
                <button onClick={()=>setExpanded(e=>({...e,[c.id]:!e[c.id]}))} className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-slate-700 hover:bg-slate-100">
                  {expanded[c.id]?<ChevronDown className="h-3.5 w-3.5" />:<ChevronRight className="h-3.5 w-3.5" />}
                  <span className="flex-1 text-left">{c.title}</span>
                </button>
                {expanded[c.id] && c.lessons.map(l => (
                  <button key={l.id} onClick={()=>loadLesson(l.id)} className={`w-full flex items-center gap-2 ml-5 px-2 py-1.5 rounded text-sm text-left ${activeLesson?.id===l.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}>
                    <FileText className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{l.title}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-white flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-72 bg-slate-50 border-r border-slate-200 flex-col sticky top-0 h-screen"><SidebarContent /></aside>
      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/40" onClick={()=>setSidebarOpen(false)}>
          <aside className="w-72 bg-white h-full flex flex-col" onClick={e=>e.stopPropagation()}><SidebarContent /></aside>
        </div>
      )}
      <main className="flex-1 min-w-0">
        <div className="md:hidden sticky top-0 bg-white border-b border-slate-200 px-4 h-14 flex items-center gap-3 z-40">
          <Button size="icon" variant="ghost" onClick={()=>setSidebarOpen(true)}><Menu className="h-5 w-5" /></Button>
          <div className="font-semibold text-slate-900 truncate">{activeLesson?.title || program.title}</div>
        </div>
        <div className="max-w-3xl mx-auto px-6 md:px-10 py-10">
          {!activeLesson ? (
            <div className="text-center py-20">
              <BookOpen className="h-12 w-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">Select a lesson from the sidebar to begin</p>
            </div>
          ) : (
            <article>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-2">{activeLesson.title}</h1>
              {activeLesson.last_synced_at && <p className="text-xs text-slate-400 mb-8">Last updated {new Date(activeLesson.last_synced_at).toLocaleDateString()}</p>}
              {!activeLesson.content_json ? (
                <div className="p-6 rounded-lg bg-amber-50 border border-amber-200 text-amber-900">
                  <p className="font-medium">Content not available yet</p>
                  <p className="text-sm mt-1">This lesson has not been synced from Notion. Please check back later.</p>
                </div>
              ) : (
                <Renderer blocks={activeLesson.content_json} />
              )}
            </article>
          )}
        </div>
      </main>
    </div>
  )
}
export default StudentProgramView
