import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Trophy, Users, Zap, Heart, TrendingUp, Calendar } from 'lucide-react'
import clsx from 'clsx'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: players }, { data: rpeRecent }, { data: medical }] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('players').select('*').order('number'),
      supabase.from('rpe_entries').select('*, player:players(short_name,position)')
        .order('session_date', { ascending: false }).limit(8),
      supabase.from('medical_records').select('*, player:players(short_name)')
        .eq('status', 'active'),
    ])

  const injured = players?.filter(p => p.status === 'injured' || p.status === 'recovering') ?? []
  const active  = players?.filter(p => p.status === 'active') ?? []

  // Last 7-day avg RPE
  const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const { data: rpeWeek } = await supabase
    .from('rpe_entries')
    .select('rpe')
    .gte('session_date', sevenDaysAgo.toISOString().split('T')[0])
  const avgRpe = rpeWeek?.length
    ? (rpeWeek.reduce((s, e) => s + e.rpe, 0) / rpeWeek.length).toFixed(1)
    : '—'

  const role = profile?.role

  return (
    <div className="space-y-6 pb-20 md:pb-0">

      {/* Welcome */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            {role === 'player' ? `Привет, ${profile?.full_name?.split(' ')[0] || ''}!` : 'МБА-МАИ · Обзор'}
          </h1>
          <p className="text-muted text-sm mt-1">
            {role === 'player'
              ? 'Твоя карточка и данные нагрузки'
              : 'Тренер: Василий Карасёв · Единая Лига ВТБ · Плей-офф 2025/26'}
          </p>
        </div>
        <div className="flex-shrink-0 text-right hidden sm:block">
          <div className="text-xs text-muted">Следующий матч</div>
          <div className="text-sm font-bold text-accent mt-0.5">МБА — УНИКС</div>
          <div className="text-xs text-muted">2 мая · 14:00</div>
        </div>
      </div>

      {/* Cup banner */}
      {role !== 'player' && (
        <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-accent/10 to-blue-500/5
                        border border-accent/20 rounded-2xl">
          <div className="text-3xl">🏆</div>
          <div>
            <div className="text-sm font-bold text-accent">Победитель Кубка России 2025/26</div>
            <div className="text-xs text-muted mt-0.5">MVP — Андрей Зубков · Тренер: Василий Карасёв</div>
          </div>
          <span className="ml-auto text-[10px] font-bold bg-accent/15 text-accent px-3 py-1 rounded-full flex-shrink-0">
            Чемпион
          </span>
        </div>
      )}

      {/* Metric cards */}
      {role !== 'player' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Игроков', value: players?.length ?? 0, icon: Users, color: 'text-blue-400', sub: `${active.length} активны` },
            { label: 'Травмировано', value: injured.length, icon: Heart, color: 'text-red-400', sub: 'требуют внимания', warn: injured.length > 0 },
            { label: 'Ср. RPE (7д)', value: avgRpe, icon: Zap, color: 'text-amber-400', sub: 'шкала Борга 1–10' },
            { label: 'Мед. случаев', value: medical?.length ?? 0, icon: TrendingUp, color: 'text-green-400', sub: 'активных' },
          ].map(card => (
            <div key={card.label} className={clsx(
              'bg-bg3 border rounded-2xl p-4',
              card.warn ? 'border-red-500/20' : 'border-white/[0.07]'
            )}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-muted uppercase tracking-widest">{card.label}</span>
                <card.icon size={14} className={card.color} />
              </div>
              <div className={clsx('text-3xl font-extrabold tracking-tight', card.color)}>{card.value}</div>
              <div className="text-[10px] text-muted mt-1">{card.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* Two column */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Recent RPE */}
        {role !== 'player' && (
          <div className="bg-bg3 border border-white/[0.07] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.04] flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Последние RPE</span>
              <a href="/load" className="text-[10px] text-accent font-bold hover:underline">Все →</a>
            </div>
            <div className="divide-y divide-white/[0.03]">
              {rpeRecent?.slice(0, 6).map(entry => {
                const rpe = entry.rpe
                const col = rpe >= 8 ? 'text-red-400' : rpe >= 6 ? 'text-amber-400' : 'text-green-400'
                return (
                  <div key={entry.id} className="flex items-center gap-3 px-5 py-3">
                    <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold',
                      rpe >= 8 ? 'bg-red-500/10 text-red-400' : rpe >= 6 ? 'bg-amber-500/10 text-amber-400' : 'bg-green-500/10 text-green-400'
                    )}>{rpe}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold truncate">{(entry as any).player?.short_name ?? '—'}</div>
                      <div className="text-[10px] text-muted">{entry.session_type} · {entry.session_date}</div>
                    </div>
                    <div className={clsx('text-xs font-mono font-bold', col)}>TL {entry.tl}</div>
                  </div>
                )
              })}
              {(!rpeRecent || rpeRecent.length === 0) && (
                <div className="px-5 py-8 text-center text-xs text-muted">Записей ещё нет</div>
              )}
            </div>
          </div>
        )}

        {/* Injured / Medical */}
        <div className="bg-bg3 border border-white/[0.07] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.04] flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted uppercase tracking-widest">
              {role === 'player' ? 'Команда' : 'Медицинские случаи'}
            </span>
            <a href={role === 'player' ? '/players' : '/medical'} className="text-[10px] text-accent font-bold hover:underline">Все →</a>
          </div>
          <div className="divide-y divide-white/[0.03]">
            {role !== 'player' && medical?.slice(0, 5).map(rec => (
              <div key={rec.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold">{(rec as any).player?.short_name ?? '—'}</div>
                  <div className="text-[10px] text-muted truncate">{rec.diagnosis}</div>
                </div>
                <span className="text-[9px] font-bold bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full">
                  {rec.expected_return ?? 'Уточняется'}
                </span>
              </div>
            ))}
            {role === 'player' && active?.slice(0, 6).map(p => (
              <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-[10px] font-bold text-blue-400">
                  {p.position}
                </div>
                <div className="flex-1">
                  <div className="text-xs font-semibold">{p.short_name}</div>
                </div>
                <div className="text-xs font-mono text-amber-400">{p.pts_avg} оч</div>
              </div>
            ))}
            {!medical?.length && role !== 'player' && (
              <div className="px-5 py-8 text-center text-xs text-green-400 font-semibold">
                ✅ Активных случаев нет
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
