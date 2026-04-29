'use client'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import { LogOut, Bell } from 'lucide-react'
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/permissions'
import type { UserProfile } from '@/types'
import clsx from 'clsx'

const SECTION_TITLES: Record<string, string> = {
  '/dashboard': 'Дашборд',
  '/players':   'Состав команды',
  '/load':      'Нагрузка и RPE',
  '/rpe':       'Мой RPE',
  '/medical':   'Медицина',
  '/analytics': 'Аналитика',
  '/admin':     'Управление системой',
}

export default function TopBar({ profile }: { profile: UserProfile }) {
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()
  const title = Object.entries(SECTION_TITLES).find(([k]) => pathname.startsWith(k))?.[1] ?? 'МБА-МАИ'

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login'); router.refresh()
  }

  return (
    <header className="h-14 bg-bg2 border-b border-white/[0.07] flex items-center justify-between px-4 md:px-6 flex-shrink-0">
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted font-medium hidden sm:block">МБА-МАИ ›</span>
        <span className="text-sm font-bold">{title}</span>
        <span className="hidden sm:block text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-400/10 text-blue-400">
          ВТБ ЛИГА
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="hidden md:block text-[10px] font-mono text-muted">
          {new Date().toLocaleDateString('ru-RU')}
        </span>
        <span className={clsx('text-[10px] font-bold px-2 py-1 rounded-full hidden sm:inline-flex', ROLE_COLORS[profile.role])}>
          {ROLE_LABELS[profile.role]}
        </span>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 text-xs text-muted hover:text-white
                     bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07]
                     rounded-lg px-3 py-1.5 transition-all"
        >
          <LogOut size={13} />
          <span className="hidden sm:inline">Выйти</span>
        </button>
      </div>
    </header>
  )
}
