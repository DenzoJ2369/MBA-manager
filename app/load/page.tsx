import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PERMISSIONS } from '@/lib/permissions'
import LoadClient from './LoadClient'
import type { Role } from '@/types'

export default async function LoadPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const role = profile?.role as Role
  if (!PERMISSIONS.canViewLoad(role)) redirect('/dashboard')

  const [{ data: players }, { data: entries }] = await Promise.all([
    supabase.from('players').select('id,number,short_name,full_name,position,status').order('number'),
    supabase.from('rpe_entries')
      .select('player_id, session_date, rpe, duration_mins, tl')
      .gte('session_date', (() => { const d = new Date(); d.setDate(d.getDate()-28); return d.toISOString().split('T')[0] })())
      .order('session_date'),
  ])

  return <LoadClient players={players ?? []} entries={entries ?? []} canEdit={PERMISSIONS.canEditLoad(role)} />
}
