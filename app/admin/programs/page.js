'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiFetch } from '../layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus, BookOpen, Trash2, Edit, MoreVertical } from 'lucide-react'
import { toast } from 'sonner'

const CATEGORIES = ['MERN Stack','Digital Marketing','Graphic Design','UI UX Design','Advanced Excel','Data Analytics','AI Tools','Other']

function ProgramsPage() {
  const [programs, setPrograms] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ title:'', description:'', category:'MERN Stack', thumbnail:'', status:'draft' })

  const load = async () => {
    setLoading(true)
    try { setPrograms(await apiFetch('/programs')) } catch (e) { toast.error(e.message) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const create = async () => {
    if (!form.title.trim()) return toast.error('Title required')
    try { await apiFetch('/programs', { method:'POST', body: JSON.stringify(form) }); setOpen(false); setForm({ title:'', description:'', category:'MERN Stack', thumbnail:'', status:'draft' }); toast.success('Program created'); load() }
    catch (e) { toast.error(e.message) }
  }
  const del = async (id) => {
    if (!confirm('Delete this program and all its content?')) return
    try { await apiFetch(`/programs/${id}`, { method:'DELETE' }); toast.success('Deleted'); load() } catch (e) { toast.error(e.message) }
  }
  const togglePublish = async (p) => {
    const newStatus = p.status === 'published' ? 'draft' : 'published'
    try { await apiFetch(`/programs/${p.id}`, { method:'PATCH', body: JSON.stringify({ status: newStatus }) }); load() } catch (e) { toast.error(e.message) }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Programs</h1>
          <p className="text-slate-500 mt-1">Manage your training programs</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="bg-blue-600 hover:bg-blue-700"><Plus className="h-4 w-4 mr-2" />New Program</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Program</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Title</Label><Input value={form.title} onChange={e=>setForm({...form, title:e.target.value})} placeholder="e.g. MERN Stack" /></div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={e=>setForm({...form, description:e.target.value})} placeholder="Brief description" rows={3} /></div>
              <div><Label>Category</Label>
                <Select value={form.category} onValueChange={v=>setForm({...form, category:v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Thumbnail URL (optional)</Label><Input value={form.thumbnail} onChange={e=>setForm({...form, thumbnail:e.target.value})} placeholder="https://..." /></div>
            </div>
            <DialogFooter><Button onClick={create} className="bg-blue-600 hover:bg-blue-700">Create</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {loading ? <div className="text-slate-400">Loading...</div> : programs.length === 0 ? (
        <Card className="border-dashed border-2 border-slate-200"><CardContent className="p-12 text-center">
          <BookOpen className="h-12 w-12 mx-auto text-slate-300 mb-3" />
          <h3 className="font-semibold text-slate-700">No programs yet</h3>
          <p className="text-sm text-slate-500 mt-1">Create your first program to get started</p>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {programs.map(p => (
            <Card key={p.id} className="border-slate-200 hover:shadow-md transition group overflow-hidden">
              <div className="h-32 bg-gradient-to-br from-blue-500 to-violet-500 relative" style={p.thumbnail ? { backgroundImage:`url(${p.thumbnail})`, backgroundSize:'cover', backgroundPosition:'center' } : {}}>
                <Badge className={`absolute top-3 right-3 ${p.status==='published'?'bg-emerald-500':'bg-slate-500'}`}>{p.status}</Badge>
              </div>
              <CardContent className="p-5">
                <div className="text-xs text-blue-600 font-medium mb-1">{p.category}</div>
                <h3 className="font-semibold text-slate-900 text-lg leading-tight">{p.title}</h3>
                <p className="text-sm text-slate-500 mt-1 line-clamp-2 min-h-[40px]">{p.description || 'No description'}</p>
                <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                  <span>{p.module_count} modules</span><span>{p.chapter_count} chapters</span><span>{p.lesson_count} lessons</span>
                </div>
                <div className="flex gap-2 mt-4">
                  <Link href={`/admin/programs/${p.id}`} className="flex-1"><Button variant="outline" className="w-full">Manage</Button></Link>
                  <Button variant="outline" onClick={()=>togglePublish(p)} className="px-3">{p.status==='published'?'Unpublish':'Publish'}</Button>
                  <Button variant="outline" onClick={()=>del(p.id)} className="px-3 text-rose-600 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
export default ProgramsPage
