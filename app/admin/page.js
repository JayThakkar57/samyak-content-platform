'use client'
import { useEffect, useState } from 'react'
import { apiFetch } from './layout'
import { Card, CardContent } from '@/components/ui/card'
import { BookOpen, Users, Layers, FolderOpen, FileText, Activity } from 'lucide-react'

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <Card className="border-slate-200">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm text-slate-500">{label}</div>
            <div className="text-3xl font-bold text-slate-900 mt-1">{value}</div>
          </div>
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${color}`}><Icon className="h-5 w-5" /></div>
        </div>
      </CardContent>
    </Card>
  )
}

function AdminDashboard() {
  const [stats, setStats] = useState(null)
  useEffect(() => { apiFetch('/admin/stats').then(setStats).catch(() => {}) }, [])
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
        <p className="text-slate-500 mt-1">Overview of your content platform</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard icon={BookOpen} label="Programs" value={stats?.programs ?? '—'} color="bg-blue-50 text-blue-600" />
        <StatCard icon={Users} label="Students" value={stats?.students ?? '—'} color="bg-emerald-50 text-emerald-600" />
        <StatCard icon={Layers} label="Modules" value={stats?.modules ?? '—'} color="bg-violet-50 text-violet-600" />
        <StatCard icon={FolderOpen} label="Chapters" value={stats?.chapters ?? '—'} color="bg-amber-50 text-amber-600" />
        <StatCard icon={FileText} label="Lessons" value={stats?.lessons ?? '—'} color="bg-rose-50 text-rose-600" />
      </div>
      <Card className="border-slate-200">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2"><Activity className="h-4 w-4 text-blue-600" />Recent Notion Syncs</h2>
          {(!stats?.recent || stats.recent.length === 0) ? (
            <p className="text-sm text-slate-500">No syncs yet. Connect a lesson to Notion to see activity here.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {stats.recent.map(r => (
                <li key={r.id} className="py-3 flex items-center justify-between">
                  <div className="text-sm text-slate-800">{r.title}</div>
                  <div className="text-xs text-slate-500">{new Date(r.last_synced_at).toLocaleString()}</div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
export default AdminDashboard
