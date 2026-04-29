import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PERMISSIONS } from '@/lib/permissions'
import PlayersClient from './PlayersClient'
import type { Role } from '@/types'

export default async function PlayersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: players }] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', user.id).single(),
    supabase.from('players').select('*').order('number'),
  ])

  const role = profile?.role as Role
  if (!PERMISSIONS.canViewAllPlayers(role)) redirect('/rpe')

  return (
    <PlayersClient
      initialPlayers={players ?? []}
      canEdit={PERMISSIONS.canEditPlayers(role)}
      role={role}
    />
  )
}
