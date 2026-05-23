'use client'
import { useEffect, useState } from 'react'
import { apiFetch } from './layout'
import { motion } from 'framer-motion'
import { BookOpen, Users, Layers, FolderOpen, FileText, Activity, Sparkles, TrendingUp } from 'lucide-react'

function StatCard({ icon: Icon, label, value, gradient, delay }) {
  return (
    <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay, duration:0.5 }} className="card-3d rounded-2xl p-6 bg-white border border-slate-200 shadow-md cursor-default">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-slate-500 uppercase tracking-wider font-medium">{label}</div>
          <div className="text-4xl font-bold text-slate-900 mt-2 font-display">{value}</div>
        </div>
        <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </motion.div>
  )
}

function AdminDashboard() {
  const [stats, setStats] = useState(null)
  useEffect(() => { apiFetch('/admin/stats').then(setStats).catch(() => {}) }, [])

  return (
    <div className="p-8 max-w-7xl mx-auto relative">
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }} className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium mb-3"><Sparkles className="h-3 w-3" />Admin Dashboard</div>
        <h1 className="font-display text-4xl font-bold text-slate-900 tracking-tight">Overview</h1>
        <p className="text-slate-500 mt-2 text-lg">Manage your content platform at a glance</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-10">
        <StatCard icon={BookOpen} label="Programs" value={stats?.programs ?? '—'} gradient="from-blue-500 to-cyan-500" delay={0.1} />
        <StatCard icon={Users} label="Students" value={stats?.students ?? '—'} gradient="from-emerald-500 to-green-500" delay={0.15} />
        <StatCard icon={Layers} label="Modules" value={stats?.modules ?? '—'} gradient="from-violet-500 to-purple-500" delay={0.2} />
        <StatCard icon={FolderOpen} label="Chapters" value={stats?.chapters ?? '—'} gradient="from-amber-500 to-orange-500" delay={0.25} />
        <StatCard icon={FileText} label="Lessons" value={stats?.lessons ?? '—'} gradient="from-pink-500 to-rose-500" delay={0.3} />
      </div>

      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4, duration:0.5 }} className="rounded-2xl p-6 bg-white border border-slate-200 shadow-md">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center"><Activity className="h-4 w-4 text-white" /></div>
            <div>
              <h2 className="text-lg font-display font-bold text-slate-900">Recent Notion Syncs</h2>
              <p className="text-xs text-slate-500">Latest content updates</p>
            </div>
          </div>
          <TrendingUp className="h-5 w-5 text-emerald-500" />
        </div>
        {(!stats?.recent || stats.recent.length === 0) ? (
          <div className="text-center py-10 text-slate-400">
            <Activity className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No syncs yet. Connect a lesson to Notion to see activity.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {stats.recent.map((r, i) => (
              <motion.li key={r.id} initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay: 0.5 + i*0.1 }} className="py-3 flex items-center justify-between hover:bg-slate-50 -mx-2 px-2 rounded-lg transition">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center border border-blue-100"><FileText className="h-4 w-4 text-blue-600" /></div>
                  <div className="text-sm text-slate-800 font-medium">{r.title}</div>
                </div>
                <div className="text-xs text-slate-500">{new Date(r.last_synced_at).toLocaleString()}</div>
              </motion.li>
            ))}
          </ul>
        )}
      </motion.div>
    </div>
  )
}
export default AdminDashboard
