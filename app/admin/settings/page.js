'use client'
import { useState } from 'react'
import { apiFetch } from '../layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Shield, Lock, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

function SettingsPage() {
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm: '' })
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (form.new_password.length < 6) return toast.error('Password must be at least 6 characters')
    if (form.new_password !== form.confirm) return toast.error('Passwords do not match')
    setLoading(true)
    try {
      await apiFetch('/auth/change-password', { method: 'POST', body: JSON.stringify({ current_password: form.current_password, new_password: form.new_password }) })
      toast.success('Password changed successfully')
      setForm({ current_password: '', new_password: '', confirm: '' })
    } catch (e) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  const isDefault = form.current_password === 'admin123'

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Settings</h1>
        <p className="text-slate-500 mt-1">Manage your account security</p>
      </div>

      <Card className="border-amber-200 bg-amber-50/50 mb-6">
        <CardContent className="p-5 flex gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-900">Security Recommendation</h3>
            <p className="text-sm text-amber-800 mt-1">If you haven't changed the default password yet, please do so now. The default <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs">admin123</code> is publicly known and easily guessable.</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5 text-blue-600" />Change Password</CardTitle>
          <CardDescription>Update your admin account password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4 max-w-md">
            <div>
              <Label>Current Password</Label>
              <Input type="password" value={form.current_password} onChange={e=>setForm({...form, current_password:e.target.value})} required />
            </div>
            <div>
              <Label>New Password</Label>
              <Input type="password" value={form.new_password} onChange={e=>setForm({...form, new_password:e.target.value})} required minLength={6} placeholder="At least 6 characters" />
            </div>
            <div>
              <Label>Confirm New Password</Label>
              <Input type="password" value={form.confirm} onChange={e=>setForm({...form, confirm:e.target.value})} required />
              {form.confirm && form.new_password === form.confirm && (
                <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />Passwords match</p>
              )}
            </div>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">{loading ? 'Saving...' : 'Update Password'}</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-slate-200 mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-emerald-600" />System Info</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <dt className="text-slate-500">Database</dt><dd className="text-slate-900 font-medium">MongoDB Atlas (Cloud)</dd>
            <dt className="text-slate-500">Content CMS</dt><dd className="text-slate-900 font-medium">Notion API</dd>
            <dt className="text-slate-500">Authentication</dt><dd className="text-slate-900 font-medium">JWT (7-day expiry)</dd>
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}
export default SettingsPage
