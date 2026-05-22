'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { apiFetch } from '../../layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Plus, ChevronDown, ChevronRight, BookOpen, Layers, FileText, Trash2, Link as LinkIcon, RefreshCw, Loader2, ArrowLeft, Edit, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

function ProgramDetail() {
  const { id } = useParams()
  const router = useRouter()
  const [program, setProgram] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState({})
  const [dialog, setDialog] = useState(null) // { type:'module'|'chapter'|'lesson', parent_id, edit }
  const [form, setForm] = useState({})
  const [syncing, setSyncing] = useState({})

  const load = async () => {
    try { setProgram(await apiFetch(`/programs/${id}`)) } catch (e) { toast.error(e.message) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [id])

  const openDialog = (type, parent_id, edit = null) => {
    setForm(edit || { title: '', description: '', notion_url: '' })
    setDialog({ type, parent_id, edit })
  }
  const save = async () => {
    const { type, parent_id, edit } = dialog
    try {
      if (edit) {
        await apiFetch(`/${type}s/${edit.id}`, { method:'PATCH', body: JSON.stringify(form) })
      } else {
        const body = { title: form.title, description: form.description }
        if (type === 'module') body.program_id = parent_id
        if (type === 'chapter') body.module_id = parent_id
        if (type === 'lesson') { body.chapter_id = parent_id; body.notion_url = form.notion_url }
        await apiFetch(`/${type}s`, { method:'POST', body: JSON.stringify(body) })
      }
      toast.success(edit ? 'Updated' : 'Created')
      setDialog(null); load()
    } catch (e) { toast.error(e.message) }
  }
  const del = async (type, itemId) => {
    if (!confirm(`Delete this ${type}?`)) return
    try { await apiFetch(`/${type}s/${itemId}`, { method:'DELETE' }); toast.success('Deleted'); load() } catch (e) { toast.error(e.message) }
  }
  const syncLesson = async (lesson) => {
    const url = lesson.notion_url || prompt('Paste Notion page URL or ID:')
    if (!url) return
    setSyncing(s => ({ ...s, [lesson.id]: true }))
    try {
      const r = await apiFetch(`/lessons/${lesson.id}/sync`, { method:'POST', body: JSON.stringify({ notion_url: url }) })
      toast.success(`Synced • ${r.block_count} blocks`)
      load()
    } catch (e) { toast.error(e.message) }
    finally { setSyncing(s => ({ ...s, [lesson.id]: false })) }
  }

  if (loading) return <div className="p-8"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>
  if (!program) return <div className="p-8">Program not found</div>

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <Link href="/admin/programs" className="text-sm text-slate-500 hover:text-blue-600 inline-flex items-center gap-1 mb-4"><ArrowLeft className="h-3.5 w-3.5" />Back to Programs</Link>
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="text-xs text-blue-600 font-medium mb-1">{program.category}</div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{program.title}</h1>
          <p className="text-slate-500 mt-1">{program.description}</p>
        </div>
        <Badge className={program.status==='published'?'bg-emerald-500':'bg-slate-400'}>{program.status}</Badge>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Curriculum</h2>
        <Button onClick={()=>openDialog('module', program.id)} className="bg-blue-600 hover:bg-blue-700"><Plus className="h-4 w-4 mr-2" />Add Module</Button>
      </div>

      {program.modules.length === 0 ? (
        <Card className="border-dashed border-2"><CardContent className="p-10 text-center text-slate-500"><Layers className="h-10 w-10 mx-auto mb-2 text-slate-300" /><p>No modules yet. Add your first module to start building the curriculum.</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {program.modules.map(m => (
            <Card key={m.id} className="border-slate-200">
              <CardContent className="p-0">
                <div className="flex items-center px-4 py-3 hover:bg-slate-50 cursor-pointer" onClick={()=>setExpanded(e=>({...e, [m.id]:!e[m.id]}))}>
                  {expanded[m.id]?<ChevronDown className="h-4 w-4 text-slate-400 mr-2" />:<ChevronRight className="h-4 w-4 text-slate-400 mr-2" />}
                  <Layers className="h-4 w-4 text-violet-500 mr-2" />
                  <div className="flex-1"><div className="font-medium text-slate-900">{m.title}</div>{m.description && <div className="text-xs text-slate-500">{m.description}</div>}</div>
                  <div className="text-xs text-slate-400 mr-2">{m.chapters.length} chapters</div>
                  <Button size="sm" variant="ghost" onClick={e=>{e.stopPropagation(); openDialog('module', program.id, m)}}><Edit className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="ghost" onClick={e=>{e.stopPropagation(); del('module', m.id)}} className="text-rose-600"><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
                {expanded[m.id] && (
                  <div className="border-t border-slate-100 bg-slate-50/50 p-3 space-y-2">
                    {m.chapters.map(c => (
                      <div key={c.id} className="bg-white rounded-md border border-slate-200">
                        <div className="flex items-center px-3 py-2 cursor-pointer hover:bg-slate-50" onClick={()=>setExpanded(e=>({...e, [c.id]:!e[c.id]}))}>
                          {expanded[c.id]?<ChevronDown className="h-3.5 w-3.5 text-slate-400 mr-2" />:<ChevronRight className="h-3.5 w-3.5 text-slate-400 mr-2" />}
                          <BookOpen className="h-3.5 w-3.5 text-amber-500 mr-2" />
                          <div className="flex-1 text-sm font-medium text-slate-800">{c.title}</div>
                          <div className="text-xs text-slate-400 mr-2">{c.lessons.length} lessons</div>
                          <Button size="sm" variant="ghost" onClick={e=>{e.stopPropagation(); openDialog('chapter', m.id, c)}}><Edit className="h-3.5 w-3.5" /></Button>
                          <Button size="sm" variant="ghost" onClick={e=>{e.stopPropagation(); del('chapter', c.id)}} className="text-rose-600"><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                        {expanded[c.id] && (
                          <div className="border-t border-slate-100 p-2 space-y-1">
                            {c.lessons.map(l => (
                              <div key={l.id} className="flex items-center gap-2 px-3 py-2 rounded hover:bg-slate-50">
                                <FileText className="h-3.5 w-3.5 text-rose-500" />
                                <div className="flex-1 text-sm text-slate-800">{l.title}</div>
                                {l.last_synced_at ? (
                                  <Badge variant="outline" className="text-xs border-emerald-200 text-emerald-700 bg-emerald-50">Synced</Badge>
                                ) : l.notion_url ? (
                                  <Badge variant="outline" className="text-xs border-amber-200 text-amber-700 bg-amber-50">Not synced</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs">No Notion link</Badge>
                                )}
                                <Button size="sm" variant="ghost" onClick={()=>syncLesson(l)} title="Sync from Notion">{syncing[l.id]?<Loader2 className="h-3.5 w-3.5 animate-spin" />:<RefreshCw className="h-3.5 w-3.5 text-blue-600" />}</Button>
                                <Button size="sm" variant="ghost" onClick={()=>openDialog('lesson', c.id, l)}><Edit className="h-3.5 w-3.5" /></Button>
                                <Button size="sm" variant="ghost" onClick={()=>del('lesson', l.id)} className="text-rose-600"><Trash2 className="h-3.5 w-3.5" /></Button>
                              </div>
                            ))}
                            <Button size="sm" variant="ghost" onClick={()=>openDialog('lesson', c.id)} className="w-full text-blue-600 hover:bg-blue-50"><Plus className="h-3.5 w-3.5 mr-1" />Add Lesson</Button>
                          </div>
                        )}
                      </div>
                    ))}
                    <Button size="sm" variant="outline" onClick={()=>openDialog('chapter', m.id)} className="w-full"><Plus className="h-3.5 w-3.5 mr-1" />Add Chapter</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!dialog} onOpenChange={v=>!v && setDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{dialog?.edit ? 'Edit' : 'New'} {dialog?.type}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Title</Label><Input value={form.title||''} onChange={e=>setForm({...form, title:e.target.value})} /></div>
            {dialog?.type !== 'lesson' && <div><Label>Description</Label><Input value={form.description||''} onChange={e=>setForm({...form, description:e.target.value})} /></div>}
            {dialog?.type === 'lesson' && (
              <div>
                <Label>Notion URL or Page ID</Label>
                <Input value={form.notion_url||''} onChange={e=>setForm({...form, notion_url:e.target.value})} placeholder="https://www.notion.so/..." />
                <p className="text-xs text-slate-500 mt-1">Paste a Notion page URL or ID. Content will be synced after save.</p>
              </div>
            )}
          </div>
          <DialogFooter><Button onClick={save} className="bg-blue-600 hover:bg-blue-700">{dialog?.edit?'Update':'Create'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
export default ProgramDetail
