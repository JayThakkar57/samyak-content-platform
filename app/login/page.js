'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2, Lock, Mail, ArrowRight, Sparkles } from 'lucide-react'

function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('admin@samyak.com')
  const [password, setPassword] = useState('admin123')
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
      toast.success(`Welcome, ${d.user.name}!`)
      router.push(d.user.role === 'admin' ? '/admin' : '/dashboard')
    } catch (e) { toast.error(e.message) } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-mesh-blue relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated background blobs */}
      <div className="floating-shape animate-float-slow w-96 h-96 bg-blue-500 top-10 left-10" />
      <div className="floating-shape animate-float-slow w-80 h-80 bg-violet-500 bottom-10 right-10" style={{animationDelay:'2s'}} />
      <div className="floating-shape animate-float-slow w-64 h-64 bg-pink-500 top-1/2 left-1/2" style={{animationDelay:'4s'}} />
      
      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="relative w-full max-w-md">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: 'easeOut' }}>
          <div className="flex flex-col items-center mb-8">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="relative mb-6"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-violet-500 blur-2xl opacity-50 animate-pulse-glow" />
              <img src="/samyak-logo.png" alt="Samyak" className="relative h-28 w-28 rounded-2xl object-cover" />
            </motion.div>
            <motion.h1 initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.4}} className="font-display text-4xl font-bold text-white tracking-tight">SaMyaK</motion.h1>
            <motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.5}} className="text-blue-200 text-sm mt-1 font-medium">Skilling India • Since 2013</motion.p>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }} className="glass-dark rounded-2xl p-8 shadow-2xl">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="h-4 w-4 text-blue-300" />
              <h2 className="text-white text-lg font-semibold">Welcome back</h2>
            </div>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-blue-100 text-xs font-medium uppercase tracking-wider">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-300" />
                  <Input className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-blue-200/50 focus:bg-white/20 focus:border-blue-400 h-11" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-blue-100 text-xs font-medium uppercase tracking-wider">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-300" />
                  <Input className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-blue-200/50 focus:bg-white/20 focus:border-blue-400 h-11" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full h-11 bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-400 hover:to-violet-500 text-white font-semibold shadow-lg shadow-blue-500/30 group">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (<>Sign in <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition" /></>)}
              </Button>
            </form>
          </motion.div>

          <motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.7}} className="text-center text-xs text-blue-300/60 mt-6">Premium content delivery platform • Powered by Notion</motion.p>
        </motion.div>
      </div>
    </div>
  )
}
export default LoginPage
