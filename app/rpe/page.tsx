import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import RpeClient from './RpeClient'
import type { Role } from '@/types'

export default async function RpePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: players }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('players').select('id, short_name, full_name, number, position, status').order('number'),
  ])

  const role = profile?.role as Role
  const playerId = profile?.player_id

  // Recent entries - staff see all, player sees own
  let query = supabase.from('rpe_entries')
    .select('*, player:players(short_name, position, number)')
    .order('session_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(50)

  if (role === 'player' && playerId) {
    query = query.eq('player_id', playerId)
  }

  const { data: entries } = await query

  return (
    <RpeClient
      role={role}
      userId={user.id}
      playerId={playerId}
      players={players ?? []}
      initialEntries={entries ?? []}
    />
  )
}
