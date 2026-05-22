'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { GraduationCap, LogOut, Loader2, BookOpen, Layers, FolderOpen, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

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

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
  if (!user) return null

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center"><GraduationCap className="h-5 w-5 text-white" /></div>
            <div className="font-bold text-slate-900">Samyak</div>
          </Link>
          <div className="flex items-center gap-3">
            <div className="text-sm text-right"><div className="font-medium text-slate-900">{user.name||'Student'}</div><div className="text-xs text-slate-500">{user.email}</div></div>
            <Button size="sm" variant="outline" onClick={()=>{localStorage.clear(); router.push('/login')}}><LogOut className="h-4 w-4" /></Button>
          </div>
        </div>
      </header>
      <div className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome back, {user.name?.split(' ')[0] || 'Student'} 👋</h1>
        <p className="text-slate-500 mt-1">Continue learning from your assigned programs</p>

        <h2 className="text-lg font-semibold text-slate-900 mt-10 mb-4">My Programs</h2>
        {programs.length === 0 ? (
          <Card className="border-dashed border-2"><CardContent className="p-12 text-center"><BookOpen className="h-12 w-12 mx-auto text-slate-300 mb-3" /><p className="text-slate-700 font-medium">No programs assigned yet</p><p className="text-sm text-slate-500 mt-1">Contact your admin to get access</p></CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {programs.map(p => (
              <Link key={p.id} href={`/dashboard/programs/${p.id}`}>
                <Card className="border-slate-200 hover:shadow-lg hover:border-blue-200 transition cursor-pointer overflow-hidden">
                  <div className="h-32 bg-gradient-to-br from-blue-500 to-violet-500" style={p.thumbnail ? { backgroundImage:`url(${p.thumbnail})`, backgroundSize:'cover', backgroundPosition:'center' } : {}} />
                  <CardContent className="p-5">
                    <div className="text-xs text-blue-600 font-medium mb-1">{p.category}</div>
                    <h3 className="font-semibold text-slate-900 text-lg leading-tight">{p.title}</h3>
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2 min-h-[40px]">{p.description}</p>
                    <div className="flex items-center gap-3 mt-4 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1"><Layers className="h-3 w-3" />{p.module_count}</span>
                      <span className="inline-flex items-center gap-1"><FolderOpen className="h-3 w-3" />{p.chapter_count}</span>
                      <span className="inline-flex items-center gap-1"><FileText className="h-3 w-3" />{p.lesson_count}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
export default StudentDashboard
