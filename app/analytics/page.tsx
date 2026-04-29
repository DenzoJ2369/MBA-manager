import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PERMISSIONS } from '@/lib/permissions'
import type { Role } from '@/types'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const role = profile?.role as Role
  if (!PERMISSIONS.canViewAnalytics(role)) redirect('/dashboard')

  // Fetch data
  const [{ data: players }, { data: allRpe }] = await Promise.all([
    supabase.from('players').select('*').order('pts_avg', { ascending: false }),
    supabase.from('rpe_entries').select('player_id, rpe, session_date, tl, duration_mins').order('session_date'),
  ])

  // Per-player avg RPE
  const rpeByPlayer: Record<string, number[]> = {}
  allRpe?.forEach(e => {
    if (!rpeByPlayer[e.player_id]) rpeByPlayer[e.player_id] = []
    rpeByPlayer[e.player_id].push(e.rpe)
  })

  const playerStats = players?.map(p => ({
    ...p,
    avgRpe: rpeByPlayer[p.id]?.length
      ? (rpeByPlayer[p.id].reduce((a,b) => a+b, 0) / rpeByPlayer[p.id].length).toFixed(1)
      : null,
    totalSessions: rpeByPlayer[p.id]?.length ?? 0,
  })) ?? []

  return (
    <div className="space-y-4 pb-20 md:pb-0">
      <div>
        <h1 className="text-xl font-extrabold">Аналитика</h1>
        <p className="text-xs text-muted mt-0.5">Сезон 2025/26 · {allRpe?.length ?? 0} записей RPE в базе</p>
      </div>

      {/* Season summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Игроков', value: players?.length ?? 0, color: 'text-blue-400' },
          { label: 'Записей RPE', value: allRpe?.length ?? 0, color: 'text-amber-400' },
          { label: 'Лучший снайпер', value: playerStats[0]?.short_name ?? '—', color: 'text-green-400', small: true },
          { label: 'Победы / Поражения', value: '25/17', color: 'text-white' },
        ].map(c => (
          <div key={c.label} className="bg-bg3 border border-white/[0.07] rounded-2xl p-4">
            <div className="text-[10px] text-muted font-bold uppercase tracking-widest mb-2">{c.label}</div>
            <div className={`${c.small ? 'text-base' : 'text-3xl'} font-extrabold font-mono ${c.color}`}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Player stats table */}
      <div className="bg-bg3 border border-white/[0.07] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.04]">
          <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Статистика игроков + нагрузка</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead>
              <tr className="border-b border-white/[0.04]">
                {['#','Игрок','Поз','Очки','Подб.','Пер.','2%','Ср. RPE','Сессий'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[9px] font-bold text-muted2 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {playerStats.map(p => {
                const rpe = p.avgRpe ? parseFloat(p.avgRpe) : 0
                const rpeColor = rpe >= 7 ? 'text-red-400' : rpe >= 5.5 ? 'text-amber-400' : 'text-green-400'
                return (
                  <tr key={p.id} className="hover:bg-white/[0.015] transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-accent font-bold">{String(p.number).padStart(2,'0')}</td>
                    <td className="px-4 py-3 text-xs font-semibold">{p.short_name}</td>
                    <td className="px-4 py-3"><span className="text-[9px] font-bold bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded">{p.position}</span></td>
                    <td className="px-4 py-3 font-mono text-xs font-bold">{p.pts_avg}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted">{p.reb_avg}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted">{p.ast_avg}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted">{p.fg2_pct}%</td>
                    <td className="px-4 py-3">
                      {p.avgRpe
                        ? <span className={`font-mono text-xs font-bold ${rpeColor}`}>{p.avgRpe}</span>
                        : <span className="text-muted2 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted">{p.totalSessions}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
