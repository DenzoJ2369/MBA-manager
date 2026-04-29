import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'
import type { UserProfile } from '@/types'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      <Sidebar profile={profile as UserProfile} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar profile={profile as UserProfile} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 page-enter">
          {children}
        </main>
      </div>
    </div>
  )
}
