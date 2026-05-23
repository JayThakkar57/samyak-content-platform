'use client'
import { useEffect, useState } from 'react'
import { apiFetch } from './layout'
import { motion } from 'framer-motion'
import { BookOpen, Users, Layers, FolderOpen, FileText, Activity } from 'lucide-react'

function StatCard({ icon: Icon, label, value, delay }) {
  return (
    <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} transition={{ delay, duration:0.4 }} className="card-elegant lift-card rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center"><Icon className="h-4 w-4 text-slate-700" /></div>
      </div>
      <div className="text-3xl font-bold text-slate-900 font-display tracking-tight">{value}</div>
      <div className="text-xs text-slate-500 mt-1">{label}</div>
    </motion.div>
  )
}

function AdminDashboard() {
  const [stats, setStats] = useState(null)
  useEffect(() => { apiFetch('/admin/stats').then(setStats).catch(() => {}) }, [])

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }} className="mb-10">
        <p className="text-sm text-slate-500">Admin Dashboard</p>
        <h1 className="font-display text-3xl font-bold text-slate-900 tracking-tight mt-1">Overview</h1>
        <p className="text-slate-600 mt-2">A glance at all your content and students.</p>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
        <StatCard icon={BookOpen} label="Programs" value={stats?.programs ?? '—'} delay={0.05} />
        <StatCard icon={Users} label="Students" value={stats?.students ?? '—'} delay={0.1} />
        <StatCard icon={Layers} label="Modules" value={stats?.modules ?? '—'} delay={0.15} />
        <StatCard icon={FolderOpen} label="Chapters" value={stats?.chapters ?? '—'} delay={0.2} />
        <StatCard icon={FileText} label="Lessons" value={stats?.lessons ?? '—'} delay={0.25} />
      </div>

      <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3, duration:0.5 }} className="card-elegant rounded-xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center"><Activity className="h-4 w-4 text-slate-700" /></div>
          <div>
            <h2 className="text-base font-display font-semibold text-slate-900">Recent Notion Syncs</h2>
            <p className="text-xs text-slate-500">Latest content updates</p>
          </div>
        </div>
        {(!stats?.recent || stats.recent.length === 0) ? (
          <div className="text-center py-8 text-slate-400">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No syncs yet. Sync a lesson from Notion to see activity here.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {stats.recent.map(r => (
              <li key={r.id} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-md bg-slate-100 flex items-center justify-center"><FileText className="h-3.5 w-3.5 text-slate-600" /></div>
                  <div className="text-sm text-slate-900">{r.title}</div>
                </div>
                <div className="text-xs text-slate-500">{new Date(r.last_synced_at).toLocaleString()}</div>
              </li>
            ))}
          </ul>
        )}
      </motion.div>

      <footer className="mt-12 pt-6 border-t border-slate-200/60 text-xs text-slate-500 flex justify-between">
        <span>© {new Date().getFullYear()} Samyak Computer Classes — Surat</span>
        <span>Built by Samyak Computer Classes Surat</span>
      </footer>
    </div>
  )
}
export default AdminDashboard
