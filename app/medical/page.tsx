import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PERMISSIONS } from '@/lib/permissions'
import type { Role } from '@/types'

export default async function MedicalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const role = profile?.role as Role
  if (!PERMISSIONS.canViewMedical(role)) redirect('/dashboard')

  const [{ data: records }, { data: players }] = await Promise.all([
    supabase.from('medical_records').select('*, player:players(short_name,number,position)').order('created_at', { ascending: false }),
    supabase.from('players').select('id,short_name,number,status').order('number'),
  ])

  const canEdit = PERMISSIONS.canEditMedical(role)

  return (
    <div className="space-y-4 pb-20 md:pb-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold">Медицина</h1>
          <p className="text-xs text-muted mt-0.5">{records?.filter(r=>r.status==='active').length ?? 0} активных случаев</p>
        </div>
      </div>

      {/* Injured players quick view */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label:'Травмированы',  value: players?.filter(p=>p.status==='injured').length ?? 0,    color:'text-red-400',    icon:'🔴' },
          { label:'Восстановление',value: players?.filter(p=>p.status==='recovering').length ?? 0, color:'text-amber-400',  icon:'🟡' },
          { label:'В строю',       value: players?.filter(p=>p.status==='active').length ?? 0,     color:'text-green-400',  icon:'🟢' },
          { label:'Активных дел',  value: records?.filter(r=>r.status==='active').length ?? 0,     color:'text-blue-400',   icon:'📋' },
        ].map(c => (
          <div key={c.label} className="bg-bg3 border border-white/[0.07] rounded-2xl p-4">
            <div className="text-[10px] text-muted font-bold uppercase tracking-widest mb-2">{c.icon} {c.label}</div>
            <div className={`text-3xl font-extrabold font-mono ${c.color}`}>{c.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-bg3 border border-white/[0.07] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.04]">
          <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Медицинские случаи</span>
        </div>
        <div className="divide-y divide-white/[0.03]">
          {records?.length === 0 && (
            <div className="py-12 text-center text-sm text-green-400 font-semibold">✅ Активных случаев нет</div>
          )}
          {records?.map(rec => (
            <div key={rec.id} className="px-5 py-4 flex items-start gap-3">
              <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${rec.status === 'active' ? 'bg-red-400' : rec.status === 'recovering' ? 'bg-amber-400' : 'bg-green-400'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold">{(rec as any).player?.short_name ?? '—'}</span>
                  <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full font-bold">
                    #{(rec as any).player?.number} · {(rec as any).player?.position}
                  </span>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${rec.status === 'active' ? 'bg-red-500/10 text-red-400' : rec.status === 'recovering' ? 'bg-amber-500/10 text-amber-400' : 'bg-green-500/10 text-green-400'}`}>
                    {rec.status === 'active' ? 'Не играет' : rec.status === 'recovering' ? 'Восстановление' : 'Допущен'}
                  </span>
                </div>
                <div className="text-sm text-white/70 mt-1">{rec.diagnosis}</div>
                {rec.notes && <div className="text-xs text-muted mt-0.5">{rec.notes}</div>}
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-[10px] text-muted">Травма: {rec.injury_date}</div>
                {rec.expected_return && <div className="text-[10px] text-amber-400 mt-0.5">Возврат: {rec.expected_return}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
