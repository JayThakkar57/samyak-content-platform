'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2, ArrowRight } from 'lucide-react'

function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { fetch('/api/seed', { method: 'POST' }).catch(() => {}) }, [])

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const r = await fetch('/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({email,password}) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Login failed')
      localStorage.setItem('samyak_token', d.token)
      localStorage.setItem('samyak_role', d.user.role)
      localStorage.setItem('samyak_user', JSON.stringify(d.user))
      toast.success(`Welcome, ${d.user.name}`)
      router.push(d.user.role === 'admin' ? '/admin' : '/dashboard')
    } catch (e) { toast.error(e.message) } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-canvas relative flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-grid opacity-50 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-stone-50 pointer-events-none" />

      <div className="relative w-full max-w-sm">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
          <div className="flex flex-col items-center mb-10">
            <img src="/samyak-logo.png" alt="Samyak" className="h-20 w-20 rounded-2xl object-cover mb-5 animate-subtle-float" />
            <h1 className="font-display text-2xl font-bold text-slate-900 tracking-tight">Samyak Computer Classes</h1>
            <p className="text-slate-500 text-sm mt-1">Surat • Skilling India since 2013</p>
          </div>

          <div className="card-elegant rounded-xl p-7">
            <h2 className="text-slate-900 text-lg font-semibold mb-1 font-display">Sign in</h2>
            <p className="text-slate-500 text-sm mb-6">Enter your credentials to access your account</p>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-slate-700 text-xs font-medium">Email</Label>
                <Input className="h-10 bg-stone-50/50 border-slate-200 focus:bg-white focus:border-slate-400" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required autoComplete="off" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-700 text-xs font-medium">Password</Label>
                <Input className="h-10 bg-stone-50/50 border-slate-200 focus:bg-white focus:border-slate-400" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required autoComplete="new-password" />
              </div>
              <Button type="submit" disabled={loading} className="w-full h-10 bg-slate-900 hover:bg-slate-800 text-white font-medium mt-2 group">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (<>Continue<ArrowRight className="h-3.5 w-3.5 ml-1.5 group-hover:translate-x-0.5 transition" /></>)}
              </Button>
            </form>
          </div>

          <p className="text-center text-xs text-slate-400 mt-8">
            © {new Date().getFullYear()} Samyak Computer Classes — Surat. All rights reserved.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
export default LoginPage
