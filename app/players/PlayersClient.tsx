'use client'
import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Search, Edit2, Trash2, X, Check, Filter } from 'lucide-react'
import clsx from 'clsx'
import type { Player, Role } from '@/types'

const POS_COLORS: Record<string, string> = {
  PG: 'bg-blue-500/10 text-blue-400',
  SG: 'bg-purple-500/10 text-purple-400',
  SF: 'bg-amber-500/10 text-amber-400',
  PF: 'bg-orange-500/10 text-orange-400',
  C:  'bg-green-500/10 text-green-400',
}
const STATUS_BADGE: Record<string, string> = {
  active:     'bg-green-500/10 text-green-400',
  injured:    'bg-red-500/10 text-red-400',
  recovering: 'bg-amber-500/10 text-amber-400',
  rest:       'bg-slate-500/10 text-slate-400',
}
const STATUS_LABEL: Record<string, string> = {
  active: 'В строю', injured: 'Травма', recovering: 'Восст.', rest: 'Запас'
}

const EMPTY: Partial<Player> = {
  number: 0, full_name: '', short_name: '', position: 'PG',
  nationality: 'Россия', flag: '🇷🇺', age: 20, status: 'active',
  pts_avg: 0, reb_avg: 0, ast_avg: 0, fg2_pct: 0,
}

export default function PlayersClient({
  initialPlayers, canEdit, role
}: { initialPlayers: Player[]; canEdit: boolean; role: Role }) {
  const supabase = createClient()
  const [players, setPlayers]   = useState(initialPlayers)
  const [search, setSearch]     = useState('')
  const [posFilter, setPosFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modal, setModal]       = useState<'add' | 'edit' | null>(null)
  const [editData, setEditData] = useState<Partial<Player>>(EMPTY)
  const [saving, setSaving]     = useState(false)
  const [toast, setToast]       = useState('')

  const filtered = useMemo(() => players.filter(p => {
    if (search && !p.full_name.toLowerCase().includes(search.toLowerCase()) &&
        !p.short_name.toLowerCase().includes(search.toLowerCase())) return false
    if (posFilter && p.position !== posFilter) return false
    if (statusFilter && p.status !== statusFilter) return false
    return true
  }), [players, search, posFilter, statusFilter])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  function openAdd() { setEditData(EMPTY); setModal('add') }
  function openEdit(p: Player) { setEditData({ ...p }); setModal('edit') }

  async function save() {
    if (!editData.full_name?.trim()) return
    setSaving(true)
    const payload = {
      number: editData.number, full_name: editData.full_name,
      short_name: editData.short_name || editData.full_name.split(' ').pop() || '',
      position: editData.position, nationality: editData.nationality,
      flag: editData.flag, age: editData.age, status: editData.status,
      pts_avg: editData.pts_avg, reb_avg: editData.reb_avg,
      ast_avg: editData.ast_avg, fg2_pct: editData.fg2_pct,
      injury_note: editData.injury_note,
    }
    if (modal === 'add') {
      const { data, error } = await supabase.from('players').insert(payload).select().single()
      if (!error && data) { setPlayers(prev => [...prev, data].sort((a,b) => a.number - b.number)); showToast('✅ Игрок добавлен') }
    } else if (editData.id) {
      const { error } = await supabase.from('players').update(payload).eq('id', editData.id)
      if (!error) {
        setPlayers(prev => prev.map(p => p.id === editData.id ? { ...p, ...payload } : p))
        showToast('✅ Данные сохранены')
      }
    }
    setSaving(false); setModal(null)
  }

  async function remove(p: Player) {
    if (!confirm(`Удалить ${p.full_name}?`)) return
    await supabase.from('players').delete().eq('id', p.id)
    setPlayers(prev => prev.filter(x => x.id !== p.id))
    showToast('🗑 Игрок удалён')
  }

  return (
    <div className="space-y-4 pb-20 md:pb-0">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold">Состав команды</h1>
          <p className="text-xs text-muted mt-0.5">{filtered.length} из {players.length} игроков · Сезон 2025/26</p>
        </div>
        {canEdit && (
          <button onClick={openAdd} className="flex items-center gap-2 bg-accent text-black text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-amber-400 transition-colors">
            <Plus size={14} /> Добавить
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[160px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск игрока…"
            className="w-full bg-bg3 border border-white/[0.07] rounded-xl pl-8 pr-3 py-2.5 text-xs outline-none focus:border-accent" />
        </div>
        <select value={posFilter} onChange={e => setPosFilter(e.target.value)}
          className="bg-bg3 border border-white/[0.07] rounded-xl px-3 py-2.5 text-xs text-muted outline-none cursor-pointer">
          <option value="">Все позиции</option>
          {['PG','SG','SF','PF','C'].map(p => <option key={p}>{p}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="bg-bg3 border border-white/[0.07] rounded-xl px-3 py-2.5 text-xs text-muted outline-none cursor-pointer">
          <option value="">Все статусы</option>
          <option value="active">В строю</option>
          <option value="injured">Травма</option>
          <option value="recovering">Восст.</option>
          <option value="rest">Запас</option>
        </select>
      </div>

      {/* Table - desktop */}
      <div className="hidden md:block bg-bg3 border border-white/[0.07] rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.04]">
              {['#','Игрок','Поз','Нац.','Возраст','Очки','Подб','Пер','2%','Статус',''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[9px] font-bold text-muted2 uppercase tracking-widest">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {filtered.map(p => (
              <tr key={p.id} className="hover:bg-white/[0.02] group transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-accent font-bold">{String(p.number).padStart(2,'0')}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className={clsx('w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold', POS_COLORS[p.position])}>
                      {p.short_name.slice(0,2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-semibold">{p.full_name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3"><span className={clsx('text-[9px] font-bold px-2 py-1 rounded-lg', POS_COLORS[p.position])}>{p.position}</span></td>
                <td className="px-4 py-3 text-xs text-muted">{p.flag} {p.nationality}</td>
                <td className="px-4 py-3 text-xs text-muted font-mono">{p.age}</td>
                <td className="px-4 py-3 text-xs font-mono font-bold">{p.pts_avg}</td>
                <td className="px-4 py-3 text-xs font-mono text-muted">{p.reb_avg}</td>
                <td className="px-4 py-3 text-xs font-mono text-muted">{p.ast_avg}</td>
                <td className="px-4 py-3 text-xs font-mono text-muted">{p.fg2_pct}%</td>
                <td className="px-4 py-3">
                  <span className={clsx('text-[9px] font-bold px-2 py-1 rounded-full', STATUS_BADGE[p.status])}>
                    {STATUS_LABEL[p.status]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {canEdit && (
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(p)} className="w-7 h-7 rounded-lg border border-white/[0.07] hover:border-accent hover:text-accent flex items-center justify-center text-muted transition-all">
                        <Edit2 size={11} />
                      </button>
                      <button onClick={() => remove(p)} className="w-7 h-7 rounded-lg border border-white/[0.07] hover:border-red-400 hover:text-red-400 flex items-center justify-center text-muted transition-all">
                        <Trash2 size={11} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards - mobile */}
      <div className="md:hidden space-y-2">
        {filtered.map(p => (
          <div key={p.id} className="bg-bg3 border border-white/[0.07] rounded-2xl p-4 flex items-center gap-3">
            <div className={clsx('w-10 h-10 rounded-xl flex flex-col items-center justify-center flex-shrink-0', POS_COLORS[p.position])}>
              <span className="font-mono text-[10px] font-bold">{String(p.number).padStart(2,'0')}</span>
              <span className="text-[8px] font-bold">{p.position}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold truncate">{p.full_name}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className={clsx('text-[9px] font-bold px-1.5 py-0.5 rounded-full', STATUS_BADGE[p.status])}>
                  {STATUS_LABEL[p.status]}
                </span>
                <span className="text-[10px] text-muted font-mono">{p.pts_avg} оч · {p.reb_avg} под</span>
              </div>
            </div>
            {canEdit && (
              <button onClick={() => openEdit(p)} className="w-8 h-8 rounded-xl border border-white/[0.07] hover:border-accent text-muted hover:text-accent flex items-center justify-center">
                <Edit2 size={13} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setModal(null) }}>
          <div className="bg-bg3 border border-white/[0.07] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-white/[0.07]">
              <h2 className="font-bold">{modal === 'add' ? 'Добавить игрока' : `Редактировать: ${editData.short_name}`}</h2>
              <button onClick={() => setModal(null)} className="w-8 h-8 rounded-lg border border-white/[0.07] hover:border-red-400 flex items-center justify-center text-muted hover:text-red-400"><X size={14} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Номер" type="number" value={editData.number ?? 0} onChange={v => setEditData(p => ({...p, number: +v}))} />
                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5">Позиция</label>
                  <select value={editData.position} onChange={e => setEditData(p => ({...p, position: e.target.value as Player['position']}))}
                    className="w-full bg-white/[0.04] border border-white/[0.07] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-accent">
                    {['PG','SG','SF','PF','C'].map(pos => <option key={pos}>{pos}</option>)}
                  </select>
                </div>
              </div>
              <Field label="Полное имя" value={editData.full_name ?? ''} onChange={v => setEditData(p => ({...p, full_name: v}))} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Короткое имя" value={editData.short_name ?? ''} onChange={v => setEditData(p => ({...p, short_name: v}))} />
                <Field label="Возраст" type="number" value={editData.age ?? 0} onChange={v => setEditData(p => ({...p, age: +v}))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Флаг (emoji)" value={editData.flag ?? '🇷🇺'} onChange={v => setEditData(p => ({...p, flag: v}))} />
                <Field label="Гражданство" value={editData.nationality ?? 'Россия'} onChange={v => setEditData(p => ({...p, nationality: v}))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Очки ср/матч" type="number" step="0.1" value={editData.pts_avg ?? 0} onChange={v => setEditData(p => ({...p, pts_avg: +v}))} />
                <Field label="Подборы ср/матч" type="number" step="0.1" value={editData.reb_avg ?? 0} onChange={v => setEditData(p => ({...p, reb_avg: +v}))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Передачи ср/матч" type="number" step="0.1" value={editData.ast_avg ?? 0} onChange={v => setEditData(p => ({...p, ast_avg: +v}))} />
                <Field label="% 2-очковых" type="number" value={editData.fg2_pct ?? 0} onChange={v => setEditData(p => ({...p, fg2_pct: +v}))} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5">Статус</label>
                <select value={editData.status} onChange={e => setEditData(p => ({...p, status: e.target.value as Player['status']}))}
                  className="w-full bg-white/[0.04] border border-white/[0.07] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-accent">
                  <option value="active">✅ В строю</option>
                  <option value="recovering">🟡 Восстановление</option>
                  <option value="injured">🔴 Травма</option>
                  <option value="rest">⚪ Запас</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-white/[0.07]">
              <button onClick={() => setModal(null)} className="flex-1 py-2.5 border border-white/[0.07] rounded-xl text-sm text-muted hover:text-white transition-colors">Отмена</button>
              <button onClick={save} disabled={saving}
                className="flex-1 py-2.5 bg-accent text-black rounded-xl text-sm font-bold hover:bg-amber-400 disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
                {saving ? 'Сохраняем…' : <><Check size={14} /> Сохранить</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 md:bottom-6 right-4 bg-bg3 border border-white/[0.07] rounded-xl px-4 py-3 text-sm font-semibold z-50 shadow-2xl animate-in slide-in-from-bottom-2">
          {toast}
        </div>
      )}
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', step }: {
  label: string; value: string | number; onChange: (v: string) => void; type?: string; step?: string
}) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5">{label}</label>
      <input type={type} step={step} value={value} onChange={e => onChange(e.target.value)}
        className="w-full bg-white/[0.04] border border-white/[0.07] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-accent transition-colors" />
    </div>
  )
}
