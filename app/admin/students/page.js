'use client'
import { useEffect, useState } from 'react'
import { apiFetch } from '../layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Users, Trash2, Edit, UserCog, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

function StudentsPage() {
  const [students, setStudents] = useState([])
  const [programs, setPrograms] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name:'', email:'', mobile:'', password:'', program_ids:[] })
  const [assignFor, setAssignFor] = useState(null)
  const [assignIds, setAssignIds] = useState([])

  const load = async () => {
    setLoading(true)
    try {
      const [s, p] = await Promise.all([apiFetch('/students'), apiFetch('/programs')])
      setStudents(s); setPrograms(p)
    } catch (e) { toast.error(e.message) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const create = async () => {
    if (!form.email || !form.password) return toast.error('Email and password required')
    try { await apiFetch('/students', { method:'POST', body: JSON.stringify(form) }); toast.success('Student created'); setOpen(false); setForm({ name:'', email:'', mobile:'', password:'', program_ids:[] }); load() }
    catch (e) { toast.error(e.message) }
  }
  const toggleStatus = async (s) => {
    try { await apiFetch(`/students/${s.id}`, { method:'PATCH', body: JSON.stringify({ status: s.status==='active'?'inactive':'active' }) }); load() } catch (e) { toast.error(e.message) }
  }
  const del = async (id) => {
    if (!confirm('Delete this student?')) return
    try { await apiFetch(`/students/${id}`, { method:'DELETE' }); toast.success('Deleted'); load() } catch (e) { toast.error(e.message) }
  }
  const openAssign = (s) => { setAssignFor(s); setAssignIds(s.programs.map(p=>p.id)) }
  const saveAssign = async () => {
    try { await apiFetch(`/students/${assignFor.id}/assign`, { method:'POST', body: JSON.stringify({ program_ids: assignIds }) }); toast.success('Programs assigned'); setAssignFor(null); load() } catch (e) { toast.error(e.message) }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Students</h1>
          <p className="text-slate-500 mt-1">Manage student accounts and program access</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="bg-blue-600 hover:bg-blue-700"><Plus className="h-4 w-4 mr-2" />New Student</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Student</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Name</Label><Input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} /></div>
              <div><Label>Email</Label><Input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} /></div>
              <div><Label>Mobile</Label><Input value={form.mobile} onChange={e=>setForm({...form,mobile:e.target.value})} /></div>
              <div><Label>Password</Label><Input type="text" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="Set initial password" /></div>
              <div>
                <Label>Assign Programs</Label>
                <div className="mt-2 space-y-1.5 max-h-40 overflow-auto border rounded-md p-2">
                  {programs.length === 0 ? <p className="text-xs text-slate-500">No programs yet</p> : programs.map(p => (
                    <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-50 p-1 rounded">
                      <Checkbox checked={form.program_ids.includes(p.id)} onCheckedChange={v=>setForm({...form, program_ids: v ? [...form.program_ids, p.id] : form.program_ids.filter(x=>x!==p.id)})} />
                      {p.title}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter><Button onClick={create} className="bg-blue-600 hover:bg-blue-700">Create</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? <Loader2 className="h-6 w-6 animate-spin text-blue-600" /> : students.length === 0 ? (
        <Card className="border-dashed border-2"><CardContent className="p-12 text-center"><Users className="h-12 w-12 mx-auto text-slate-300 mb-3" /><p className="text-slate-500">No students yet</p></CardContent></Card>
      ) : (
        <Card className="border-slate-200"><CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Name</th><th className="px-5 py-3">Email</th><th className="px-5 py-3">Mobile</th><th className="px-5 py-3">Programs</th><th className="px-5 py-3">Status</th><th className="px-5 py-3"></th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {students.map(s => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-900">{s.name || '—'}</td>
                  <td className="px-5 py-3 text-slate-700">{s.email}</td>
                  <td className="px-5 py-3 text-slate-500">{s.mobile || '—'}</td>
                  <td className="px-5 py-3"><div className="flex flex-wrap gap-1">{s.programs.length===0?<span className="text-xs text-slate-400">None</span>:s.programs.map(p=><Badge key={p.id} variant="outline" className="text-xs">{p.title}</Badge>)}</div></td>
                  <td className="px-5 py-3"><Badge className={s.status==='active'?'bg-emerald-500':'bg-slate-400'}>{s.status}</Badge></td>
                  <td className="px-5 py-3 text-right">
                    <Button size="sm" variant="ghost" onClick={()=>openAssign(s)} title="Assign programs"><UserCog className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={()=>toggleStatus(s)}>{s.status==='active'?'Deactivate':'Activate'}</Button>
                    <Button size="sm" variant="ghost" onClick={()=>del(s.id)} className="text-rose-600"><Trash2 className="h-4 w-4" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent></Card>
      )}

      <Dialog open={!!assignFor} onOpenChange={v=>!v && setAssignFor(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Assign Programs — {assignFor?.name || assignFor?.email}</DialogTitle></DialogHeader>
          <div className="space-y-2 max-h-64 overflow-auto">
            {programs.map(p => (
              <label key={p.id} className="flex items-center gap-2 p-2 rounded hover:bg-slate-50 cursor-pointer">
                <Checkbox checked={assignIds.includes(p.id)} onCheckedChange={v=>setAssignIds(v ? [...assignIds, p.id] : assignIds.filter(x=>x!==p.id))} />
                <div><div className="font-medium">{p.title}</div><div className="text-xs text-slate-500">{p.category}</div></div>
              </label>
            ))}
          </div>
          <DialogFooter><Button onClick={saveAssign} className="bg-blue-600 hover:bg-blue-700">Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
export default StudentsPage
