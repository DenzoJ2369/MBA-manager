'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, ChevronDown } from 'lucide-react'
import clsx from 'clsx'
import type { Role } from '@/types'

const RPE_LABELS = ['','Покой','Очень легко','Легко','Умеренно-легко','Умеренно','Умер.-тяжело','Тяжело','Очень тяжело','Экстремально','Максимум']
const RPE_EMOJIS = ['','😴','😌','🙂','🚶','🏃','💪','😤','😰','😩','💀']

const SESSION_TYPES = [
  'Тренировка', 'Силовая тренировка', 'Тактика / площадка',
  'Восстановление', 'Спарринг', 'Матч', 'Индивидуальная'
]

function rpeColor(rpe: number) {
  if (rpe <= 2) return { bg: 'bg-green-500/15', text: 'text-green-400', border: 'border-green-500/30' }
  if (rpe <= 4) return { bg: 'bg-green-500/10', text: 'text-emerald-400', border: 'border-green-500/20' }
  if (rpe === 5) return { bg: 'bg-amber-500/12', text: 'text-amber-400', border: 'border-amber-500/25' }
  if (rpe <= 7) return { bg: 'bg-amber-500/15', text: 'text-orange-400', border: 'border-amber-500/30' }
  if (rpe === 8) return { bg: 'bg-red-500/12', text: 'text-red-400', border: 'border-red-500/25' }
  return { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/35' }
}

export default function RpeClient({ role, userId, playerId, players, initialEntries }: {
  role: Role; userId: string; playerId?: string | null
  players: any[]; initialEntries: any[]
}) {
  const supabase = createClient()
  const isPlayer = role === 'player'

  const [entries, setEntries] = useState(initialEntries)
  const [showForm, setShowForm] = useState(false)
  const [rpe, setRpe] = useState(5)
  const [mins, setMins] = useState(90)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [sessionType, setSessionType] = useState('Тренировка')
  const [comment, setComment] = useState('')
  const [selectedPlayerId, setSelectedPlayerId] = useState(playerId || players[0]?.id || '')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  function showToastMsg(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  async function submitRpe() {
    if (!selectedPlayerId) return
    setSaving(true)
    const { data, error } = await supabase.from('rpe_entries').insert({
      player_id: selectedPlayerId,
      session_type: sessionType,
      session_date: date,
      rpe, duration_mins: mins,
      comment: comment || null,
      created_by: userId,
    }).select('*, player:players(short_name, position, number)').single()

    if (!error && data) {
      setEntries(prev => [data, ...prev])
      setShowForm(false)
      setRpe(5); setMins(90); setComment('')
      showToastMsg(`✅ RPE ${rpe} сохранён · TL: ${rpe * mins}`)
    }
    setSaving(false)
  }

  async function deleteEntry(id: string) {
    if (!confirm('Удалить запись?')) return
    await supabase.from('rpe_entries').delete().eq('id', id)
    setEntries(prev => prev.filter(e => e.id !== id))
    showToastMsg('🗑 Удалено')
  }

  const col = rpeColor(rpe)

  return (
    <div className="space-y-4 pb-24 md:pb-0 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold">{isPlayer ? 'Мой RPE' : 'Нагрузка · RPE'}</h1>
          <p className="text-xs text-muted mt-0.5">
            {isPlayer ? 'Оцени нагрузку после тренировки' : `Журнал нагрузки · ${entries.length} записей`}
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-accent text-black text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-amber-400 transition-colors">
          <Plus size={14} /> {isPlayer ? 'Внести RPE' : 'Добавить'}
        </button>
      </div>

      {/* RPE Input Form */}
      {showForm && (
        <div className="bg-bg3 border border-white/[0.07] rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-white/[0.04]">
            <h2 className="text-sm font-bold">
              {isPlayer ? '🎯 Как ты себя чувствовал?' : '📝 Внести RPE'}
            </h2>
          </div>
          <div className="p-5 space-y-5">
            {/* Player select (staff only) */}
            {!isPlayer && (
              <div>
                <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-2">Игрок</label>
                <select value={selectedPlayerId} onChange={e => setSelectedPlayerId(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/[0.07] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-accent">
                  {players.map(p => (
                    <option key={p.id} value={p.id}>#{p.number} {p.full_name} · {p.position}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Big RPE slider */}
            <div>
              <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-3">
                Воспринимаемая нагрузка (Борг 1–10)
              </label>
              {/* RPE value display */}
              <div className={clsx('flex items-center gap-4 p-4 rounded-2xl border mb-4 transition-all', col.bg, col.border)}>
                <div className={clsx('text-5xl font-extrabold font-mono min-w-[3rem] text-center', col.text)}>
                  {rpe}
                </div>
                <div>
                  <div className="text-xl">{RPE_EMOJIS[rpe]}</div>
                  <div className={clsx('text-sm font-bold mt-0.5', col.text)}>{RPE_LABELS[rpe]}</div>
                  <div className="text-xs text-muted mt-0.5">TL = {rpe} × {mins} = <span className="font-bold text-white">{rpe * mins}</span></div>
                </div>
              </div>

              <input type="range" min="1" max="10" value={rpe} onChange={e => setRpe(+e.target.value)}
                className="w-full h-3 rounded-full cursor-pointer appearance-none"
                style={{ accentColor: '#F5A623' }} />
              <div className="flex justify-between text-[9px] text-muted2 mt-1 px-0.5">
                <span>1 Покой</span><span>3 Легко</span><span>5 Умеренно</span><span>7 Тяжело</span><span>10 Макс</span>
              </div>
            </div>

            {/* Date + mins */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5">Дата</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/[0.07] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-accent" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5">Минуты</label>
                <input type="number" value={mins} onChange={e => setMins(+e.target.value)} min={10} max={300}
                  className="w-full bg-white/[0.04] border border-white/[0.07] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-accent" />
              </div>
            </div>

            {/* Session type */}
            <div>
              <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5">Тип занятия</label>
              <select value={sessionType} onChange={e => setSessionType(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.07] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-accent">
                {SESSION_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>

            {/* Comment */}
            <div>
              <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5">Комментарий (необязательно)</label>
              <input value={comment} onChange={e => setComment(e.target.value)}
                placeholder={isPlayer ? 'Как себя чувствовал? Боли, усталость…' : 'Заметки тренера…'}
                className="w-full bg-white/[0.04] border border-white/[0.07] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-accent" />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowForm(false)} className="flex-1 py-3 border border-white/[0.07] rounded-xl text-sm text-muted hover:text-white transition-colors">
                Отмена
              </button>
              <button onClick={submitRpe} disabled={saving}
                className={clsx('flex-1 py-3 rounded-xl text-sm font-bold transition-all', col.bg, col.text, col.border, 'border',
                  !saving && 'hover:opacity-90 active:scale-[0.98]',
                  saving && 'opacity-60 cursor-not-allowed'
                )}>
                {saving ? 'Сохраняем…' : `💾 Сохранить RPE ${rpe}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Entries list */}
      <div className="bg-bg3 border border-white/[0.07] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.04]">
          <span className="text-[10px] font-bold text-muted uppercase tracking-widest">
            {isPlayer ? 'История RPE' : 'Все записи RPE'}
          </span>
        </div>
        <div className="divide-y divide-white/[0.03]">
          {entries.length === 0 && (
            <div className="py-12 text-center text-sm text-muted">
              {isPlayer ? 'Ещё нет записей. Внеси первый RPE! 👆' : 'Записей нет'}
            </div>
          )}
          {entries.map(e => {
            const c = rpeColor(e.rpe)
            return (
              <div key={e.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/[0.02] group transition-colors">
                <div className={clsx('w-10 h-10 rounded-xl flex flex-col items-center justify-center flex-shrink-0 border', c.bg, c.border)}>
                  <span className={clsx('text-sm font-bold font-mono', c.text)}>{e.rpe}</span>
                  <span className="text-[8px] text-muted">RPE</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {!isPlayer && <span className="text-xs font-bold">{e.player?.short_name ?? '—'}</span>}
                    <span className="text-[10px] text-muted">{e.session_type}</span>
                  </div>
                  <div className="text-[10px] text-muted2 mt-0.5">
                    {e.session_date} · {e.duration_mins} мин
                    {e.comment && ` · ${e.comment}`}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className={clsx('text-xs font-mono font-bold', c.text)}>TL {e.tl}</div>
                  <div className="text-[9px] text-muted2">{e.duration_mins} мин</div>
                </div>
                {!isPlayer && (
                  <button onClick={() => deleteEntry(e.id)}
                    className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg border border-white/[0.07] hover:border-red-400 text-muted hover:text-red-400 flex items-center justify-center transition-all ml-1">
                    <Trash2 size={11} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 md:bottom-6 right-4 bg-bg3 border border-white/[0.07] rounded-xl px-4 py-3 text-sm font-semibold z-50 shadow-2xl">
          {toast}
        </div>
      )}
    </div>
  )
}
