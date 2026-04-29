'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Edit2, Shield, Users, Check, X } from 'lucide-react'
import clsx from 'clsx'
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/permissions'
import type { UserProfile, Role } from '@/types'

const ROLES: Role[] = ['admin','head_coach','fitness_coach','medical','analyst','player']

export default function AdminClient({ users, players }: { users: UserProfile[]; players: any[] }) {
  const supabase = createClient()
  const [list, setList] = useState(users)
  const [editId, setEditId] = useState<string | null>(null)
  const [editRole, setEditRole] = useState<Role>('player')
  const [editPlayerId, setEditPlayerId] = useState<string>('')
  const [editName, setEditName] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  function startEdit(u: UserProfile) {
    setEditId(u.id); setEditRole(u.role)
    setEditPlayerId(u.player_id ?? '')
    setEditName(u.full_name)
  }

  async function saveEdit(id: string) {
    setSaving(true)
    const { error } = await supabase.from('profiles').update({
      role: editRole,
      player_id: editPlayerId || null,
      full_name: editName,
    }).eq('id', id)
    if (!error) {
      setList(prev => prev.map(u => u.id === id
        ? { ...u, role: editRole, player_id: editPlayerId || null, full_name: editName }
        : u
      ))
      setToast('✅ Пользователь обновлён')
      setTimeout(() => setToast(''), 3000)
    }
    setSaving(false); setEditId(null)
  }

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
          <Shield size={18} className="text-red-400" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold">Управление системой</h1>
          <p className="text-xs text-muted">{list.length} пользователей · Только администратор</p>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-500/5 border border-blue-500/15 rounded-2xl p-5">
        <h3 className="text-sm font-bold text-blue-400 mb-3">📋 Как добавить пользователя</h3>
        <ol className="text-xs text-muted space-y-2">
          <li><span className="text-white font-semibold">1.</span> Откройте Supabase → Authentication → Users → Invite user</li>
          <li><span className="text-white font-semibold">2.</span> Введите email сотрудника или игрока, отправьте приглашение</li>
          <li><span className="text-white font-semibold">3.</span> Пользователь появится в списке ниже (с ролью «Игрок» по умолчанию)</li>
          <li><span className="text-white font-semibold">4.</span> Назначьте нужную роль и, если игрок — выберите его карточку</li>
        </ol>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {ROLES.map(r => {
          const count = list.filter(u => u.role === r).length
          return (
            <div key={r} className="bg-bg3 border border-white/[0.07] rounded-xl p-3 text-center">
              <div className="text-lg font-bold">{count}</div>
              <div className={clsx('text-[9px] font-bold mt-1 px-1.5 py-0.5 rounded-full inline-block', ROLE_COLORS[r])}>
                {ROLE_LABELS[r]}
              </div>
            </div>
          )
        })}
      </div>

      {/* Users table */}
      <div className="bg-bg3 border border-white/[0.07] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.04] flex items-center gap-2">
          <Users size={14} className="text-muted" />
          <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Пользователи</span>
        </div>
        <div className="divide-y divide-white/[0.03]">
          {list.map(u => (
            <div key={u.id} className={clsx('px-5 py-4', editId === u.id && 'bg-accent/5')}>
              {editId === u.id ? (
                /* Edit row */
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[9px] font-bold text-muted uppercase tracking-wider block mb-1">Имя</label>
                      <input value={editName} onChange={e => setEditName(e.target.value)}
                        className="w-full bg-white/[0.04] border border-white/[0.07] rounded-xl px-3 py-2 text-sm outline-none focus:border-accent" />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-muted uppercase tracking-wider block mb-1">Роль</label>
                      <select value={editRole} onChange={e => setEditRole(e.target.value as Role)}
                        className="w-full bg-bg2 border border-white/[0.07] rounded-xl px-3 py-2 text-sm outline-none focus:border-accent">
                        {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                      </select>
                    </div>
                    {editRole === 'player' && (
                      <div>
                        <label className="text-[9px] font-bold text-muted uppercase tracking-wider block mb-1">Карточка игрока</label>
                        <select value={editPlayerId} onChange={e => setEditPlayerId(e.target.value)}
                          className="w-full bg-bg2 border border-white/[0.07] rounded-xl px-3 py-2 text-sm outline-none focus:border-accent">
                          <option value="">— не выбрано —</option>
                          {players.map(p => <option key={p.id} value={p.id}>#{p.number} {p.short_name}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(u.id)} disabled={saving}
                      className="flex items-center gap-1.5 bg-accent text-black text-xs font-bold px-4 py-2 rounded-xl hover:bg-amber-400 disabled:opacity-60 transition-colors">
                      <Check size={12} /> Сохранить
                    </button>
                    <button onClick={() => setEditId(null)}
                      className="flex items-center gap-1.5 border border-white/[0.07] text-muted text-xs px-4 py-2 rounded-xl hover:text-white transition-colors">
                      <X size={12} /> Отмена
                    </button>
                  </div>
                </div>
              ) : (
                /* View row */
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-accent/15 flex items-center justify-center text-sm font-bold text-accent flex-shrink-0">
                    {u.full_name?.charAt(0) || u.email?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold">{u.full_name || '—'}</span>
                      <span className={clsx('text-[9px] font-bold px-2 py-0.5 rounded-full', ROLE_COLORS[u.role])}>
                        {ROLE_LABELS[u.role]}
                      </span>
                    </div>
                    <div className="text-[10px] text-muted mt-0.5">{u.email}</div>
                  </div>
                  <button onClick={() => startEdit(u)}
                    className="w-8 h-8 rounded-xl border border-white/[0.07] hover:border-accent text-muted hover:text-accent flex items-center justify-center transition-all flex-shrink-0">
                    <Edit2 size={12} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-24 md:bottom-6 right-4 bg-bg3 border border-white/[0.07] rounded-xl px-4 py-3 text-sm font-semibold z-50 shadow-2xl">
          {toast}
        </div>
      )}
    </div>
  )
}
