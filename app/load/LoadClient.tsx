'use client'
import { useMemo } from 'react'
import clsx from 'clsx'

function rpeClass(rpe: number | undefined) {
  if (!rpe) return null
  if (rpe <= 2) return { bg: 'bg-green-500/15 border-green-500/20', text: 'text-green-400' }
  if (rpe <= 4) return { bg: 'bg-green-500/10 border-green-500/15', text: 'text-emerald-400' }
  if (rpe === 5) return { bg: 'bg-amber-500/12 border-amber-500/20', text: 'text-amber-400' }
  if (rpe <= 7) return { bg: 'bg-amber-500/15 border-amber-500/25', text: 'text-orange-400' }
  if (rpe === 8) return { bg: 'bg-red-500/12 border-red-500/20', text: 'text-red-400' }
  return { bg: 'bg-red-500/20 border-red-500/30', text: 'text-red-400' }
}

// Generate last 7 days
function getLast7Days() {
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i)
    days.push(d.toISOString().split('T')[0])
  }
  return days
}

const DAY_NAMES: Record<string, string> = {
  0:'ВС',1:'ПН',2:'ВТ',3:'СР',4:'ЧТ',5:'ПТ',6:'СБ'
}

export default function LoadClient({ players, entries, canEdit }: {
  players: any[]; entries: any[]; canEdit: boolean
}) {
  const days = getLast7Days()

  // Build lookup: playerId → date → avg rpe
  const lookup = useMemo(() => {
    const map: Record<string, Record<string, number[]>> = {}
    entries.forEach(e => {
      if (!map[e.player_id]) map[e.player_id] = {}
      if (!map[e.player_id][e.session_date]) map[e.player_id][e.session_date] = []
      map[e.player_id][e.session_date].push(e.rpe)
    })
    return map
  }, [entries])

  function avgRpe(pid: string, date: string) {
    const vals = lookup[pid]?.[date]
    if (!vals?.length) return undefined
    return Math.round(vals.reduce((a,b) => a+b, 0) / vals.length)
  }

  // Per-player week avg
  function weekAvg(pid: string) {
    const vals = days.flatMap(d => lookup[pid]?.[d] ?? [])
    if (!vals.length) return null
    return (vals.reduce((a,b) => a+b, 0) / vals.length).toFixed(1)
  }

  // Team averages per day
  const teamDayAvg = days.map(d => {
    const vals = players.flatMap(p => lookup[p.id]?.[d] ?? [])
    return vals.length ? Math.round(vals.reduce((a,b) => a+b, 0) / vals.length) : null
  })

  const activePlayers = players.filter(p => p.status !== 'rest')
  const injured = players.filter(p => p.status === 'injured')
  const teamAvgAll = (() => {
    const all = days.flatMap(d => players.flatMap(p => lookup[p.id]?.[d] ?? []))
    return all.length ? (all.reduce((a,b) => a+b, 0) / all.length).toFixed(1) : '—'
  })()

  return (
    <div className="space-y-4 pb-20 md:pb-0">
      <div>
        <h1 className="text-xl font-extrabold">Нагрузка · RPE</h1>
        <p className="text-xs text-muted mt-0.5">Последние 7 дней · Тепловая карта по игрокам</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Ср. RPE команды', value: teamAvgAll, color: 'text-amber-400' },
          { label: 'Записей за неделю', value: entries.filter(e => days.includes(e.session_date)).length, color: 'text-blue-400' },
          { label: 'Активных игроков', value: activePlayers.length, color: 'text-green-400' },
          { label: 'Не в строю', value: injured.length, color: 'text-red-400' },
        ].map(c => (
          <div key={c.label} className="bg-bg3 border border-white/[0.07] rounded-2xl p-4">
            <div className="text-[10px] text-muted font-bold uppercase tracking-widest mb-2">{c.label}</div>
            <div className={clsx('text-3xl font-extrabold font-mono', c.color)}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Heatmap */}
      <div className="bg-bg3 border border-white/[0.07] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.04]">
          <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Тепловая карта RPE · 7 дней</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-white/[0.04]">
                <th className="px-4 py-3 text-left text-[9px] font-bold text-muted2 uppercase tracking-widest w-40">Игрок</th>
                <th className="px-2 py-3 text-[9px] font-bold text-muted2 uppercase tracking-widest w-10">Поз</th>
                {days.map(d => {
                  const dt = new Date(d)
                  const isToday = d === new Date().toISOString().split('T')[0]
                  return (
                    <th key={d} className={clsx('px-1 py-3 text-center', isToday && 'bg-accent/5')}>
                      <div className={clsx('text-[9px] font-bold', isToday ? 'text-accent' : 'text-muted2')}>
                        {DAY_NAMES[dt.getDay()]}
                      </div>
                      <div className={clsx('text-[8px]', isToday ? 'text-accent' : 'text-muted2')}>
                        {d.slice(8)}
                      </div>
                    </th>
                  )
                })}
                <th className="px-4 py-3 text-center text-[9px] font-bold text-muted2 uppercase tracking-widest">Ср.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {/* Team row */}
              <tr className="bg-white/[0.02]">
                <td className="px-4 py-2.5 text-[10px] font-bold text-accent">Команда</td>
                <td className="px-2 py-2.5"></td>
                {teamDayAvg.map((avg, i) => {
                  const c = avg ? rpeClass(avg) : null
                  return (
                    <td key={i} className="px-1 py-2.5 text-center">
                      {avg ? (
                        <div className={clsx('w-8 h-8 mx-auto rounded-lg border flex items-center justify-center text-xs font-bold font-mono', c?.bg, c?.text)}>
                          {avg}
                        </div>
                      ) : <div className="w-8 h-8 mx-auto rounded-lg border border-dashed border-white/[0.05]" />}
                    </td>
                  )
                })}
                <td className="px-4 py-2.5 text-center font-mono text-xs font-bold text-amber-400">{teamAvgAll}</td>
              </tr>
              {/* Player rows */}
              {activePlayers.map(p => {
                const wa = weekAvg(p.id)
                const waNum = wa ? parseFloat(wa) : 0
                const wc = wa ? rpeClass(Math.round(waNum)) : null
                return (
                  <tr key={p.id} className="hover:bg-white/[0.015] transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="text-xs font-semibold">{p.short_name}</div>
                    </td>
                    <td className="px-2 py-2.5">
                      <span className="text-[9px] font-bold bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded">{p.position}</span>
                    </td>
                    {days.map(d => {
                      const val = avgRpe(p.id, d)
                      const c = val ? rpeClass(val) : null
                      const isToday = d === new Date().toISOString().split('T')[0]
                      return (
                        <td key={d} className={clsx('px-1 py-2.5 text-center', isToday && 'bg-accent/[0.03]')}>
                          {val ? (
                            <div className={clsx('w-8 h-8 mx-auto rounded-lg border flex items-center justify-center text-xs font-bold font-mono cursor-default', c?.bg, c?.text)}
                              title={`RPE ${val}`}>
                              {val}
                            </div>
                          ) : (
                            <div className="w-8 h-8 mx-auto rounded-lg border border-dashed border-white/[0.05]" />
                          )}
                        </td>
                      )
                    })}
                    <td className="px-4 py-2.5 text-center">
                      {wa ? <span className={clsx('font-mono text-xs font-bold', wc?.text)}>{wa}</span>
                           : <span className="text-muted2 text-xs">—</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {/* Legend */}
        <div className="px-5 py-3 border-t border-white/[0.04] flex flex-wrap gap-3">
          {[
            { label:'1–2 Отдых', cls:'bg-green-500/15 text-green-400 border-green-500/20' },
            { label:'3–4 Легко', cls:'bg-green-500/10 text-emerald-400 border-green-500/15' },
            { label:'5 Умеренно', cls:'bg-amber-500/12 text-amber-400 border-amber-500/20' },
            { label:'6–7 Тяжело', cls:'bg-amber-500/15 text-orange-400 border-amber-500/25' },
            { label:'8 Очень тяж.', cls:'bg-red-500/12 text-red-400 border-red-500/20' },
            { label:'9–10 Макс', cls:'bg-red-500/20 text-red-400 border-red-500/30' },
          ].map(l => (
            <div key={l.label} className={clsx('text-[9px] font-bold px-2 py-1 rounded-lg border', l.cls)}>{l.label}</div>
          ))}
        </div>
      </div>
    </div>
  )
}
