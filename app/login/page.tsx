'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import clsx from 'clsx'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError('Неверный email или пароль'); setLoading(false); return }
    router.push('/dashboard'); router.refresh()
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-accent rounded-2xl text-3xl mb-4 shadow-lg shadow-accent/25">
            🏀
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">МБА-МАИ</h1>
          <p className="text-muted text-sm mt-1 font-medium">Manager 360 · Единая Лига ВТБ</p>
        </div>

        {/* Card */}
        <div className="bg-bg2 border border-white/[0.07] rounded-2xl p-8 shadow-2xl">
          <h2 className="text-lg font-bold mb-6">Вход в систему</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-muted uppercase tracking-widest mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full bg-white/[0.04] border border-white/[0.07] rounded-xl
                           px-4 py-3 text-sm outline-none transition-all
                           focus:border-accent focus:bg-accent/[0.04]
                           placeholder:text-muted"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-muted uppercase tracking-widest mb-2">
                Пароль
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-white/[0.04] border border-white/[0.07] rounded-xl
                             px-4 py-3 pr-12 text-sm outline-none transition-all
                             focus:border-accent focus:bg-accent/[0.04]
                             placeholder:text-muted"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={clsx(
                'w-full flex items-center justify-center gap-2 rounded-xl py-3',
                'text-sm font-bold bg-accent text-black transition-all',
                'hover:bg-accent-dark active:scale-[0.98]',
                loading && 'opacity-70 cursor-not-allowed'
              )}
            >
              {loading ? <><Loader2 size={16} className="animate-spin" />Входим…</> : 'Войти'}
            </button>
          </form>

          {/* Role hint */}
          <div className="mt-6 p-4 bg-white/[0.02] rounded-xl border border-white/[0.04]">
            <p className="text-xs text-muted2 font-semibold uppercase tracking-wider mb-3">Роли в системе</p>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {[
                ['🔑','Администратор','Полный доступ'],
                ['🏀','Главный тренер','Состав, нагрузка'],
                ['⚡','Физтренер','Нагрузка, RPE'],
                ['🩺','Врач','Медицинские данные'],
                ['📊','Аналитик','Статистика, графики'],
                ['👤','Игрок','Своя карточка + RPE'],
              ].map(([icon, role, desc]) => (
                <div key={role} className="flex items-start gap-1.5">
                  <span>{icon}</span>
                  <div>
                    <div className="text-white/60 font-medium">{role}</div>
                    <div className="text-muted2">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-muted2 mt-4">
          Доступ предоставляется администратором клуба
        </p>
      </div>
    </div>
  )
}
